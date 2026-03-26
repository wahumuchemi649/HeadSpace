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
from therapy.models import therapists
from super_admin.models import Organization  # or wherever Organization is defined
from consultation.models import Sessions

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
   

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_therapists(request):
    """
    Return available therapists based on patient's affiliation.
    
    Organization members see:
    - Tab 1: Their org therapists (FREE)
    - Tab 2: Other org therapists (PAID)
    - Tab 3: Independent therapists (PAID)
    
    Independent patients see:
    - Tab 1 (DEFAULT): Independent therapists (PAID)
    - Tab 2: Organization therapists (PAID - if org accepts public)
    """
    print("\n" + "="*60)
    print("🔍 DEBUGGING get_available_therapists")
    print("="*60)
    try:
                # Step 1: Get user
        print(f"Step 1: User = {request.user.username}")
        
        # Step 2: Get patient profile
        print(f"Step 2: Looking for patient profile...")
        patient_profile = patient.objects.get(user=request.user)
    except patient.DoesNotExist:
        return JsonResponse({'error': 'Patient profile not found'}, status=404)
    print(f"Step 3: Checking organization...")
    print(f"Has 'organization' attribute: {hasattr(patient_profile, 'organization')}")    
    
    print("\n" + "="*60)
    print("GET AVAILABLE THERAPISTS")
    print("="*60)
    print(f"Patient: {patient_profile.firstName} {patient_profile.lastName}")
    print(f"Organization: {patient_profile.organization.name if patient_profile.organization else 'None (Independent)'}")
    
    # Check if patient belongs to an organization
    if patient_profile.organization:
        # ============================================
        # ORGANIZATION MEMBER - THREE CATEGORIES
        # ============================================
        print("Patient Type: ORGANIZATION MEMBER")
        
        # Tab 1: My Organization Therapists (FREE)
        my_org_therapists = therapists.objects.filter(
            organization=patient_profile.organization,
            is_active=True
        ).select_related('user', 'organization')
        
        print(f"My org therapists: {my_org_therapists.count()}")
        
        # Tab 2: Other Organizations' Therapists (PAID)
        # Get orgs that accept public patients
        public_orgs = Organization.objects.filter(
            accept_public_patients=True,
            is_active=True
        ).exclude(id=patient_profile.organization.id)
        
        other_org_therapists = therapists.objects.filter(
            organization__in=public_orgs,
            is_active=True
        ).select_related('user', 'organization')
        
        print(f"Other org therapists: {other_org_therapists.count()}")
        
        # Tab 3: Independent Therapists (PAID)
        independent_therapists = therapists.objects.filter(
            organization__isnull=True,
            is_active=True
        ).select_related('user')
        
        print(f"Independent therapists: {independent_therapists.count()}")
        print("="*60 + "\n")
        
        return JsonResponse({
            'patient_type': 'organization',
            'organization': {
                'id': patient_profile.organization.id,
                'name': patient_profile.organization.name,
                'code': patient_profile.organization.organization_code
            },
            'my_org_therapists': format_therapists_for_booking(
                my_org_therapists, 
                is_free=True
            ),
            'other_org_therapists': format_therapists_for_booking(
                other_org_therapists, 
                is_free=False
            ),
            'independent_therapists': format_therapists_for_booking(
                independent_therapists, 
                is_free=False
            )
        })
    else:
        # ============================================
        # INDEPENDENT PATIENT - TWO CATEGORIES
        # ============================================
        print("Patient Type: INDEPENDENT PATIENT")
        
        # Tab 1 (DEFAULT): Independent Therapists
        independent_therapists = therapists.objects.filter(
            organization__isnull=True,
            is_active=True
        ).select_related('user')
        
        print(f"Independent therapists: {independent_therapists.count()}")
        
        # Tab 2: Organization Therapists (that accept public)
        public_orgs = Organization.objects.filter(
            accept_public_patients=True,
            is_active=True
        )
        
        org_therapists = therapists.objects.filter(
            organization__in=public_orgs,
            is_active=True
        ).select_related('user', 'organization')
        
        print(f"Organization therapists: {org_therapists.count()}")
        print("="*60 + "\n")
        
        return JsonResponse({
            'patient_type': 'independent',
            'independent_therapists': format_therapists_for_booking(
                independent_therapists, 
                is_free=False
            ),
            'org_therapists': format_therapists_for_booking(
                org_therapists, 
                is_free=False
            )
        })


# patients/views.py

def format_therapists_for_booking(therapist_queryset, is_free=False):
    """
    Format therapist data for booking page
    Returns same structure as your old /therapists/ endpoint + pricing info
    """
    
    therapist_list = []
    
    for t in therapist_queryset:
        # Count sessions (for display)
        try:
            sessions_count = Sessions.objects.filter(therapist=t).count()
        except:
            sessions_count = 0
        
        # Basic data (same as your old endpoint)
        therapist_data = {
            'id': t.id,
            'firstName': t.firstName,
            'lastName': t.lastName,
            'email': t.user.email if t.user else '',
            'phoneNumber': t.phoneNumber,
            'specialty_1': t.specialty_1 or '',
            'specialty_2': t.specialty_2 or '',
            'specialty_3': t.specialty_3 or '',
            'profile_pic': t.profile_pic.url if hasattr(t, 'profile_pic') and t.profile_pic else '/default-avatar.png',
            'rating': 4.5,  # TODO: Implement real ratings
            'sessions_count': sessions_count,
            'is_active': getattr(t, 'is_active', True),
            
            # NEW: Pricing information
            'is_free': is_free,
        }
        
        # Add session rates (both 45 and 60 minute rates)
        if is_free:
            therapist_data['session_rate_45'] = 0
            therapist_data['session_rate_60'] = 0
        elif t.organization:
            # Organization therapist - use org's public rate
            rate = float(t.organization.public_session_rate) if hasattr(t.organization, 'public_session_rate') else 4000.0
            therapist_data['session_rate_45'] = rate * 0.75  # 45 min is 75% of 60 min
            therapist_data['session_rate_60'] = rate
        else:
            # Independent therapist - use their own rates
            therapist_data['session_rate_45'] = float(t.session_rate_45) if hasattr(t, 'session_rate_45') else 2500.0
            therapist_data['session_rate_60'] = float(t.session_rate_60) if hasattr(t, 'session_rate_60') else 3000.0
        
        # Add organization info if applicable
        if t.organization:
            therapist_data['organization_name'] = t.organization.name
            therapist_data['organization_id'] = t.organization.id
        else:
            therapist_data['organization_name'] = None
            therapist_data['organization_id'] = None
        
        therapist_list.append(therapist_data)
    
    return therapist_list


def get_therapist_rate(therapist):
    """
    Get the session rate for a therapist
    """
    if therapist.organization:
        # Organization therapist - use org's public rate
        return float(therapist.organization.public_session_rate) if hasattr(therapist.organization, 'public_session_rate') else 4000
    else:
        # Independent therapist - use their own rate
        # TODO: Add session_rate field to therapists model
        return 3000  # Default for now   