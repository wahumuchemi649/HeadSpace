import json
from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes


from patients.models import patient
from consultation.models import Sessions
from chatRoom.models import Message  
from .models import therapists
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User


def Therapists_lists(request):
    Therapists = therapists.objects.all().values("id", "firstName", "lastName", "profile_pic", "description")
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
        unread_messages=Message.objects.filter(sender_therapist=user, is_read=False).count()
        return JsonResponse({
        
        "FirstName": user.firstName,
        "LastName": user.lastName,
        "Email": user.email,
        "PhoneNumber": user.phoneNumber,
        "Profile_pic": user.profile_pic.url if user.profile_pic else None,
        "stat":{
            "todaysSessions": todays_sessions,
            "totalClients": total_clients,
            "unreadMessages": unread_messages   
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