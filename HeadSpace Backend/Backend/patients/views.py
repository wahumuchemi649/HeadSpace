from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import patient
from .serializers import useSerializers
from django.contrib.auth.hashers import check_password

@api_view(['POST'])
def register_patient(request):
    serializers = useSerializers(data=request.data)
    if serializers.is_valid():
        serializers.save()
        return Response({'message': "User registered successfully"}, status=status.HTTP_201_CREATED)
    return Response(serializers.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_patients(request):
    patients = patient.objects.all()
    serializer = useSerializers(patients, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    

    print(f"Login attempt - Email: {email}")  # Debug
    print(f"Password received: {password}") # remove in production
    if not email or not password:
        return Response(
            {"message": "Email and password are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = patient.objects.get(email=email)
        print(f"User found: {user.email}") 
        # Debug
        password_match = check_password(password, user.password)
        print(f"Password match: {password_match}")  # Debug
        if check_password(password, user.password):
            print(f"password match:{user.password}")
            # Fixed: removed extra space in 'user_id '

            

            request.session['patient_id'] = user.id
            request.session['patient_email'] = user.email
            request.session['user_type'] = 'patient'
            request.session.save()
            print(f"✅ Login successful for {user.email}")
            print(f"Session key: {request.session.session_key}")
            print(f"Session data: {dict(request.session)}")
            
            return Response({
                "message": 'Login Successful',
                "user": {
                    "id": user.id,
                    "email": user.email,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response(
        {"message": "Invalid credentials"},
        status=status.HTTP_401_UNAUTHORIZED
    )

    except patient.DoesNotExist:
        return Response(
            {"message": "Invalid credentials"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        return Response(
            {"message": "An error occurred during login"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
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