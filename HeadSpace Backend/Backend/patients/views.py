from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import patient
from .serializers import useSerializers
from django.contrib.auth.hashers import check_password

@api_view(['POST'])
def register_patient(request):
    serializers=useSerializers(data=request.data)
    if serializers.is_valid():
        serializers.save()
        return Response({'message':"User registered successfully"})
    return Response(serializers.errors,status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_patients(request):
    patients = patient.objects.all()
    serializer = useSerializers(patients, many=True)
    return Response(serializer.data)

# Create your views here.
@api_view(['POST'])
def login(request):
    
    email= request.data.get('email')
    password=request.data.get('password')

    try:
        user= patient.objects.get(email=email)
        if check_password(password,user.password):
          return Response({"message":'Login Successful' }, status=200)
        
        else:
            return Response({"message":"Invalid credentials"}, status=400)

    except patient.DoesNotExist:
        return Response({"message":"User not found: Sign up"})

    
    

   