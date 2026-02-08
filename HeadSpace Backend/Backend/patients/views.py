from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import patient
from .serializers import useSerializers
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from django.contrib.auth.models import User
from django.db import transaction

@api_view(['POST'])
def register_patient(request):
    data = request.data
    
    email = data.get('email')
    password = data.get('password')
    firstName = data.get('firstName')
    lastName = data.get('lastName')
    phoneNumber = data.get('phoneNumber')
    
    # Validate
    if not all([email, password, firstName, lastName, phoneNumber]):
        return Response({
            'message': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user already exists
    if User.objects.filter(username=email).exists():
        return Response({
            'message': 'User with this email already exists. Please login.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Use transaction to ensure both User and patient are created together
        with transaction.atomic():
            # Create Django User
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
            
            # Create patient profile
            patient_profile = patient.objects.create(
                user=user,
                firstName=firstName,
                lastName=lastName,
                phoneNumber=phoneNumber
            )
        
        return Response({
            'message': "User registered successfully"
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # transaction.atomic() will automatically rollback if error occurs
        print(f"Registration error: {e}")
        return Response({
            'message': f'Registration failed: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['GET'])
def list_patients(request):
    patients = patient.objects.all()
    serializer = useSerializers(patients, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def login(request):
    from django.contrib.auth import authenticate
    
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Authenticate with Django User
    user = authenticate(username=email, password=password)
    
    if user:
        # Get patient profile
        patient_profile = patient.objects.get(user=user)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "message": 'Login Successful',
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": patient_profile.id,
                "email": user.email,
                "firstName": patient_profile.firstName,
                "lastName": patient_profile.lastName,
            }
        }, status=status.HTTP_200_OK)
    
    return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)    
        
@api_view(['GET'])
def check_session(request):
    """Check if the patient has an active session"""
    user_id = request.session.get('patient_id')
    email = request.session.get('patient_email')

    
    if user_id and email:
        return Response({
            "is_logged_in": True,
            "user": {
                "id": user_id,
                "email": email
            }
        }, status=status.HTTP_200_OK) 
    else:
        return Response({
            "is_logged_in": False,
            "message": "No active session"
        }, status=status.HTTP_401_UNAUTHORIZED)
    


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patientDashboard(request):
    print(f"📍Dashboard accessed by: {request.user}")
    # request.user is now the Django User
    patient_profile = patient.objects.get(user=request.user)
    
    return JsonResponse({
        "firstName": patient_profile.firstName,
        "lastName": patient_profile.lastName,
        "email": request.user.email
    })
   