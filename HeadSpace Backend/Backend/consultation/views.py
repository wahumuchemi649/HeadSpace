from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Sessions
from therapy.models import therapists
import json

@csrf_exempt
def session(request):
    if request.method=="POST":
        data =json.loads(request.body)
        therapist_id=data.get('therapist_id')
        time= data.get('time')
        reason=data.get('reason')

        th=therapists.objects.get(id=therapist_id)
        

        
        booking = Sessions.objects.create(
            therapist=th,
            time=time,
            reason=reason
        )

        return JsonResponse({'message':"Booking Saved", 'id':booking.id})
    

