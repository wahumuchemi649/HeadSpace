from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Sessions
from therapy.models import therapists
from patients.models import patient
import json


@csrf_exempt
def session(request):
    if request.method=="POST":
        data =json.loads(request.body)
        therapist_id=data.get('therapist_id')

        print(f"🔍 REQUEST DEBUG:")
        print(f"Session key: {request.session.session_key}")
        print(f"Session items: {dict(request.session.items())}")
        print(f"Cookies received: {request.COOKIES}")
        print(f"Session cookie name: {settings.SESSION_COOKIE_NAME}")
        print("Therapist ID received:", therapist_id)
        time= data.get('time')
        reason=data.get('reason')

        th=therapists.objects.get(id=therapist_id)
        
        patient_id = request.session.get('patient_id')
        user_type = request.session.get('user_type')
        if user_type != 'patient':
             return JsonResponse({'error': 'Only patients can book sessions'}, status=403)
        print(f"Patient ID from session: {patient_id}")  # Debug
        if not patient_id:
            print(f"❌ No patient_id in session")
            return JsonResponse({'error': 'Please login first'}, status=401)

        current_patient = patient.objects.get(id= patient_id)  # Replace with actual logic to get the current patient
        

        
        booking = Sessions.objects.create(
            therapist=th,
            time=time,
            reason=reason,
            patient=current_patient,
        )
        

        return JsonResponse({'message':"Booking Saved", 'id':booking.id})
                 
    

