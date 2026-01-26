import json
from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes

from patients.models import patient
from consultation.models import Sessions
from .models import therapists
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import TherapistAvailability
from datetime import datetime, timedelta,time




def Therapists_lists(request):
    Therapists = therapists.objects.all().values("id", "firstName", "lastName", "profile_pic", "description","specialty_1","specialty_2","specialty_3")
    return JsonResponse(list(Therapists), safe=False)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        phoneNumber = data.get('phoneNumber')
        
        try:
            user = therapists.objects.get(email=email)
            
            if str(phoneNumber).strip() == str(user.phoneNumber).strip():
                
                request.session['therapist_id'] = user.id
                request.session['therapist_email'] = user.email
                request.session['user_type'] = 'therapist'
                request.session.save()

                print(f"✅ Login successful for {user.email}")
                print(f"Session key: {request.session.session_key}")
                print(f"Session data: {dict(request.session)}")
                
                # Just return JsonResponse - Django sets the cookie automatically
                return JsonResponse({
                    "message": f"Welcome Dr. {user.firstName}",
                    "success": True
                }, status=200)
            else:
                return JsonResponse({"message": "Invalid credentials"}, status=400)
        except therapists.DoesNotExist:
            return JsonResponse({"message": "User not found: Sign up"}, status=404)
    
    return JsonResponse({"message": "Method not allowed"}, status=405)

    

      
def dashboard(request):
    print(f"📍Dashboard accessed")
    print(f"Session key from request: {request.session.session_key}")
    print(f"Session data: {dict(request.session)}")
    print(f"Cookies received: {request.COOKIES}")
    print(f"Has sessionid cookie: {'sessionid' in request.COOKIES}")
    email = request.session.get('therapist_email')
    if not email:
        return JsonResponse({"message": "Not logged in"}, status=401)
    
    try:
        user = therapists.objects.get(email=email)
        from datetime import date
        todays_sessions=Sessions.objects.filter(therapist=user, day=date.today()).count()
        total_clients=patient.objects.filter(sessions__therapist=user).distinct().count()
        #unread_messages=Message.objects.filter(sender_therapist=user, is_read=False).count()
        return JsonResponse({
        
        "FirstName": user.firstName,
        "LastName": user.lastName,
        "Email": user.email,
        "PhoneNumber": user.phoneNumber,
        "Profile_pic": user.profile_pic.url if user.profile_pic else None,
        "stat":{
            "todaysSessions": todays_sessions,
            "totalClients": total_clients,
            #"unreadMessages": unread_messages   
        }
        })
    except therapists.DoesNotExist:
        return JsonResponse({"message": "User not found"}, status=404)

@api_view(['GET'])
def therapist_sessions(request):
    print(f"Session key from request: {request.session.session_key}")
    print(f"Session data: {dict(request.session)}")
    print(f"Cookies received: {request.COOKIES}")
    print(f"Has sessionid cookie: {'sessionid' in request.COOKIES}")
    print(f"Cookies received: {request.COOKIES}")
    email = request.session.get('therapist_email')
    if not email:
        return JsonResponse({"message": "Not logged in"}, status=401)
    #therapist_id = request.session.get('therapist_id')
    if not email:
        return JsonResponse({'error': 'Only therapists can view sessions'}, status=403)

    try:
        therapist = therapists.objects.get(email=email)
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist not found'}, status=404)

    # Fetch sessions for this therapist
    sessions = Sessions.objects.filter(therapist=therapist)
    data = [
        {
            'id': s.id,
            'patient_name': s.patient.name,
            'time': s.time.isoformat(),
            'reason': s.reason,
        }
        for s in sessions
    ]
    return JsonResponse(data, safe=False)


def get_availability_grid(request):
    """Get therapist's weekly availability grid"""
    therapist_id = request.session.get('therapist_id')
    
    if not therapist_id:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    # Define time slots (9am - 5pm)
    time_slots = [
        '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00'
    ]
    
    # Days of week
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    # Build grid
    grid = []
    
    for time_str in time_slots:
        row = {
            'time': time_str,
            'time_display': datetime.strptime(time_str, '%H:%M').strftime('%I:%M %p'),
            'slots': []
        }
        
        for day_index in range(7):
            # Get or check if slot exists
            slot = TherapistAvailability.objects.filter(
                therapist_id=therapist_id,
                day_of_week=day_index,
                time_slot=time_str
            ).first()
            
            # Check if this slot is booked
            is_booked = False
            if slot:
                # Get next occurrence of this day
                today = datetime.now().date()
                days_ahead = day_index - today.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                next_date = today + timedelta(days=days_ahead)
                slot_time = datetime.strptime(time_str, "%H:%M").time()

                
                is_booked = Sessions.objects.filter(
                    therapist_id=therapist_id,
                    day=next_date,
                    time=slot_time,
                    is_active=True

                ).exists()
            
            row['slots'].append({
                'day': day_index,
                'day_name': days[day_index],
                'is_available': slot.is_available if slot else False,
                'is_booked': is_booked,
                'exists': slot is not None
            })
        
        grid.append(row)
    
    return JsonResponse({
        'grid': grid,
        'days': days
    })


@csrf_exempt
def toggle_availability(request):
    """Toggle a specific time slot's availability"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    therapist_id = request.session.get('therapist_id')
    
    if not therapist_id:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    try:
        data = json.loads(request.body)
        day_of_week = data.get('day_of_week')
        time_slot_str = data.get('time_slot')  # String like "09:00"
        
        # ✅ Convert string to time object
        time_slot = datetime.strptime(time_slot_str, "%H:%M").time()
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except ValueError:
        return JsonResponse({'error': 'Invalid time format'}, status=400)
    
    # Get or create the slot
    slot, created = TherapistAvailability.objects.get_or_create(
        therapist_id=therapist_id,
        day_of_week=day_of_week,
        time_slot=time_slot,  # Now it's a time object
        defaults={'is_available': True}
    )
    
    # Check if slot is booked
    today = datetime.now().date()
    days_ahead = day_of_week - today.weekday()
    if days_ahead < 0:
        days_ahead += 7
    next_date = today + timedelta(days=days_ahead)
    
    # ✅ Now both are time objects - comparison will work!
    is_booked = Sessions.objects.filter(
        therapist_id=therapist_id,
        day=next_date,
        time=time_slot,  # time object
        is_active=True
    ).exists()
    
    if is_booked:
        return JsonResponse({
            'error': 'Cannot change availability - slot is already booked',
            'is_booked': True
        }, status=400)
    
    # Toggle availability
    if not created:
        slot.is_available = not slot.is_available
        slot.save()
    
    return JsonResponse({
        'success': True,
        'day_of_week': day_of_week,
        'time_slot': time_slot_str,  # Return string for frontend
        'is_available': slot.is_available
    })
def get_therapist_availability_for_patient(request, therapist_id):
    """
    Get a specific therapist's availability (for patients booking)
    Same as therapist's own view, but read-only
    """
    # Define time slots
    time_slots = [
        '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00'
    ]
    
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    grid = []
    
    for time_str in time_slots:
        row = {
            'time': time_str,
            'time_display': datetime.strptime(time_str, '%H:%M').strftime('%I:%M %p'),
            'slots': []
        }
        
        for day_index in range(7):
            slot = TherapistAvailability.objects.filter(
                therapist_id=therapist_id,
                day_of_week=day_index,
                time_slot=time_str
            ).first()
            
            is_booked = False
            if slot:
                today = datetime.now().date()
                days_ahead = day_index - today.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                next_date = today + timedelta(days=days_ahead)
                slot_time = datetime.strptime(time_str, "%H:%M").time()
                
                is_booked = Sessions.objects.filter(
                    therapist_id=therapist_id,
                    day=next_date,
                    time=slot_time,
                    is_active=True
                ).exists()
            
            row['slots'].append({
                'day': day_index,
                'day_name': days[day_index],
                'is_available': slot.is_available if slot else False,
                'is_booked': is_booked,
                'exists': slot is not None
            })
        
        grid.append(row)
    
    return JsonResponse({
        'grid': grid,
        'days': days,
        'therapist_id': therapist_id
    })