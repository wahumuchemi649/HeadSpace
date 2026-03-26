import json
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from patients.models import patient
from chat.models import Messages
from consultation.models import Sessions
from .models import therapists, TherapistAvailability
from django.core.mail import EmailMessage
from datetime import datetime, timedelta, time, date
from django.conf import settings
from rest_framework.permissions import AllowAny
import logging
import traceback


def Therapists_lists(request):
    """Public endpoint - no auth needed"""
    Therapists = therapists.objects.all()
    
    data = [
        {
            "id": t.id,
            "firstName": t.firstName,
            "lastName": t.lastName,
            "profile_pic": t.profile_pic.url if t.profile_pic else None,  # ← Get full URL
            "description": t.description,
            "specialty_1": t.specialty_1,
            "specialty_2": t.specialty_2,
            "specialty_3": t.specialty_3,
        }
        for t in Therapists
    ]
    
    return JsonResponse(data, safe=False)

@api_view(['POST'])
def login_view(request):
    """Therapist login - returns JWT tokens"""
    email = request.data.get('email')
    phoneNumber = request.data.get('phoneNumber')
    
    try:
        therapist = therapists.objects.get(user__email=email)
        
        # Normalize phone numbers (remove spaces, dashes, etc.)
        input_phone = str(phoneNumber).strip().replace(' ', '').replace('-', '')
        stored_phone = str(therapist.phoneNumber).strip().replace(' ', '').replace('-', '')
        
        if input_phone == stored_phone:
            # Generate JWT tokens
            user = therapist.user
            refresh = RefreshToken.for_user(user)
            
            # Add custom claims
            refresh['email'] = user.email
            refresh['user_type'] = 'therapist'
            
            print(f"✅ Login successful for {user.email}")
            
            return JsonResponse({
                "message": f"Welcome Dr. {therapist.firstName}",
                "success": True,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": therapist.id,
                    "email": user.email,
                    "firstName": therapist.firstName,
                    "lastName": therapist.lastName
                }
            }, status=200)
        else:
            return JsonResponse({"message": "Invalid credentials"}, status=400)
            
    except therapists.DoesNotExist:
        return JsonResponse({"message": "User not found: Sign up"}, status=404)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Therapist dashboard"""
    user = request.user
    
    try:
        therapist = therapists.objects.get(user=user)
        
        # Stats
        todays_sessions = Sessions.objects.filter(
            therapist=therapist, 
            day=date.today()
        ).count()
        
        total_clients = patient.objects.filter(
            sessions__therapist=therapist
        ).distinct().count()
        
        unread_messages = Messages.objects.filter(
            session__therapist=therapist,
            is_read=False,
            sender_type='patient'
        ).count()
        
        return JsonResponse({
            "FirstName": therapist.firstName,
            "LastName": therapist.lastName,
            "Email": user.email,
            "PhoneNumber": therapist.phoneNumber,
            "Profile_pic": therapist.profile_pic.url if therapist.profile_pic else None,
            "stat": {
                "todaysSessions": todays_sessions,
                "totalClients": total_clients,
                "unreadMessages": unread_messages   
            }
        })
        
    except therapists.DoesNotExist:
        return JsonResponse({"message": "Therapist profile not found"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def therapist_sessions(request):
    """Get therapist's sessions"""
    user = request.user
    
    try:
        therapist = therapists.objects.get(user=user)
        
        # Fetch sessions for this therapist
        sessions = Sessions.objects.filter(therapist=therapist).select_related('patient')
        
        data = [
            {
                'id': s.id,
                'patient_name': f"{s.patient.firstName} {s.patient.lastName}",
                'day': s.day.isoformat(),
                'time': s.time.isoformat(),
                'reason_category': s.reason_category,
                'reason': s.reason,
                'status': s.status,
                'duration_minutes': s.duration_minutes
            }
            for s in sessions
        ]
        
        return JsonResponse(data, safe=False)
        
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_availability_grid(request):
    """Get therapist's weekly availability grid"""
    user = request.user
    
    try:
        therapist = therapists.objects.get(user=user)
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist profile not found'}, status=404)
    
    # Define time slots (9am - 5pm)
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
                therapist=therapist,
                day_of_week=day_index,
                time_slot=time_str
            ).first()
            
            # Check if booked
            is_booked = False
            if slot:
                today = datetime.now().date()
                days_ahead = day_index - today.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                next_date = today + timedelta(days=days_ahead)
                slot_time = datetime.strptime(time_str, "%H:%M").time()
                
                is_booked = Sessions.objects.filter(
                    therapist=therapist,
                    day=next_date,
                    time=slot_time,
                    status__in=['scheduled', 'active']
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_availability(request):
    """Toggle a specific time slot's availability"""
    user = request.user
    
    try:
        therapist = therapists.objects.get(user=user)
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist profile not found'}, status=404)
    
    try:
        day_of_week = request.data.get('day_of_week')
        time_slot_str = request.data.get('time_slot')
        
        # Convert string to time object
        time_slot = datetime.strptime(time_slot_str, "%H:%M").time()
        
    except ValueError:
        return JsonResponse({'error': 'Invalid time format'}, status=400)
    
    # Get or create the slot
    slot, created = TherapistAvailability.objects.get_or_create(
        therapist=therapist,
        day_of_week=day_of_week,
        time_slot=time_slot,
        defaults={'is_available': True}
    )
    
    # Check if slot is booked
    today = datetime.now().date()
    days_ahead = day_of_week - today.weekday()
    if days_ahead < 0:
        days_ahead += 7
    next_date = today + timedelta(days=days_ahead)
    
    is_booked = Sessions.objects.filter(
        therapist=therapist,
        day=next_date,
        time=time_slot,
        status__in=['scheduled', 'active']
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
        'time_slot': time_slot_str,
        'is_available': slot.is_available
    })


@api_view(['GET'])
def get_therapist_availability_for_patient(request, therapist_id):
    """
    Get a specific therapist's availability (for patients booking)
    Public endpoint - no auth required
    """
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
                    status__in=['scheduled', 'active']
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



logger = logging.getLogger(__name__)

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anyone to apply
def therapist_apply(request):
    """
    Handle therapist application submissions.
    Sends application details via email with attachments.
    """
    try:
        # Extract form data
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        email = request.data.get('email', '').strip()
        phone = request.data.get('phone', '').strip()
        specialties = request.data.getlist('specialties')
        
        print("\n" + "="*60)
        print("THERAPIST APPLICATION RECEIVED")
        print("="*60)
        print(f"Name: {first_name} {last_name}")
        print(f"Email: {email}")
        print(f"Phone: {phone}")
        print(f"Specialties: {specialties}")
        print(f"Profile pic: {'Yes' if request.FILES.get('profile_pic') else 'No'}")
        print(f"Documents: {len(request.FILES.getlist('documents'))}")
        
        # Validation
        if not all([first_name, last_name, email, phone]):
            return Response({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
        if len(specialties) != 3:
            return Response({
                'success': False,
                'error': 'Please select exactly 3 specialties'
            }, status=400)
        
        # Format specialty labels
        specialty_labels = {
            'anxiety_stress': 'Anxiety / Stress',
            'depression': 'Depression',
            'trauma_ptsd': 'Trauma / PTSD',
            'relationship_issues': 'Relationship Issues',
            'self_esteem': 'Self-esteem Issues',
            'burnout': 'Burnout / Work-related Stress',
            'grief_loss': 'Grief / Loss',
            'family_problems': 'Family Problems',
            'substance_use': 'Substance Use',
            'academic_pressure': 'Academic Pressure'
        }
        
        formatted_specialties = [specialty_labels.get(s, s) for s in specialties]
        
        # Compose email
        email_body = f"""
New Therapist Application Received
===================================

APPLICANT INFORMATION:
----------------------
Name: {first_name} {last_name}
Email: {email}
Phone: {phone}

SPECIALTIES:
------------
{chr(10).join(f"• {specialty}" for specialty in formatted_specialties)}

ATTACHMENTS:
------------
Profile Picture: {"✓ Included" if request.FILES.get('profile_pic') else "✗ Not provided"}
Documents: {len(request.FILES.getlist('documents'))} file(s) attached

---
This is an automated email from HeadSpace Therapist Application System.
Please review the application and attachments, then contact the applicant.

Reply to this email to contact: {email}
        """
        
        print("\nComposing email...")
        
        email_msg = EmailMessage(
            subject=f'🩺 New Therapist Application - {first_name} {last_name}',
            body=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=['chelsfavor@gmail.com'],  # Your receiving email
            reply_to=[email]  # Allow easy reply to applicant
        )
        
        # Attach profile picture
        profile_pic = request.FILES.get('profile_pic')
        if profile_pic:
            email_msg.attach(
                profile_pic.name,
                profile_pic.read(),
                profile_pic.content_type
            )
            print(f"✓ Profile pic attached: {profile_pic.name}")
        
        # Attach documents
        documents = request.FILES.getlist('documents')
        for doc in documents:
            email_msg.attach(
                doc.name,
                doc.read(),
                doc.content_type
            )
            print(f"✓ Document attached: {doc.name}")
        
        # Send email
        print("\nSending email...")
        email_msg.send(fail_silently=False)
        
        print("✅ Email sent successfully!")
        print("="*60 + "\n")
        
        logger.info(f"Therapist application submitted: {email}")
        
        return Response({
            'success': True,
            'message': 'Application submitted successfully! We will contact you soon.'
        }, status=200)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("="*60 + "\n")
        
        logger.error(f"Therapist application error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': f'Failed to submit application: {str(e)}'
        }, status=500)

# therapy/views.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_therapist_pricing(request):
    """Get pricing settings for the logged-in therapist"""
    
    try:
        # Get therapist profile
        therapist = therapists.objects.get(user=request.user)
        
        print("\n" + "="*60)
        print("GET THERAPIST PRICING")
        print("="*60)
        print(f"Therapist: Dr. {therapist.firstName} {therapist.lastName}")
        print(f"Organization: {therapist.organization.name if therapist.organization else 'Independent'}")
        
        # Check if therapist is independent
        if therapist.organization:
            return JsonResponse({
                'error': 'Only independent therapists can set their own pricing',
                'message': 'Your pricing is managed by your organization'
            }, status=403)
        
        print(f"45-min rate: KES {therapist.session_rate_45}")
        print(f"60-min rate: KES {therapist.session_rate_60}")
        print("="*60 + "\n")
        
        return JsonResponse({
            'therapist': {
                'id': therapist.id,
                'name': f"Dr. {therapist.firstName} {therapist.lastName}",
                'email': therapist.user.email,  # ✅ FIXED: Get email from User model
                'phone': therapist.phoneNumber,
                'is_independent': True
            },
            'pricing': {
                'session_rate_45': float(therapist.session_rate_45),
                'session_rate_60': float(therapist.session_rate_60)
            }
        })
        
    except therapists.DoesNotExist:
        print("❌ Therapist profile not found")
        return JsonResponse({'error': 'Therapist profile not found'}, status=404)
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_therapist_pricing(request):
    """Update pricing settings for the logged-in therapist"""
    
    try:
        # Get therapist profile
        therapist = therapists.objects.get(user=request.user)
        
        print("\n" + "="*60)
        print("UPDATE THERAPIST PRICING")
        print("="*60)
        print(f"Therapist: Dr. {therapist.firstName} {therapist.lastName}")
        
        # Check if therapist is independent
        if therapist.organization:
            return JsonResponse({
                'error': 'Only independent therapists can set their own pricing',
                'message': 'Your pricing is managed by your organization'
            }, status=403)
        
        data = request.data
        
        # Get new rates
        new_rate_45 = data.get('session_rate_45')
        new_rate_60 = data.get('session_rate_60')
        
        # Validate rates
        if new_rate_45 is None or new_rate_60 is None:
            return JsonResponse({'error': 'Both session rates are required'}, status=400)
        
        try:
            new_rate_45 = float(new_rate_45)
            new_rate_60 = float(new_rate_60)
        except ValueError:
            return JsonResponse({'error': 'Invalid rate values'}, status=400)
        
        if new_rate_45 < 1000 or new_rate_60 < 1000:
            return JsonResponse({
                'error': 'Session rates must be at least KES 1,000'
            }, status=400)
        
        if new_rate_60 <= new_rate_45:
            return JsonResponse({
                'error': '60-minute sessions must cost more than 45-minute sessions'
            }, status=400)
        
        # Update rates
        old_rate_45 = therapist.session_rate_45
        old_rate_60 = therapist.session_rate_60
        
        therapist.session_rate_45 = new_rate_45
        therapist.session_rate_60 = new_rate_60
        therapist.save()
        
        print(f"✓ 45-min rate: KES {old_rate_45} → KES {new_rate_45}")
        print(f"✓ 60-min rate: KES {old_rate_60} → KES {new_rate_60}")
        print("✅ Pricing updated successfully")
        print("="*60 + "\n")
        
        return JsonResponse({
            'message': 'Pricing updated successfully',
            'pricing': {
                'session_rate_45': float(therapist.session_rate_45),
                'session_rate_60': float(therapist.session_rate_60)
            }
        })
        
    except therapists.DoesNotExist:
        print("❌ Therapist profile not found")
        return JsonResponse({'error': 'Therapist profile not found'}, status=404)
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)