from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Sessions
from therapy.models import therapists
from patients.models import patient
from datetime import datetime, timedelta, date
import json
from patients.utils import send_booking_confirmation_email
import uuid


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def session(request):
    # Get user from JWT token
    user = request.user
    
    # Determine if user is patient or therapist
    try:
        current_patient = patient.objects.get(user=user)
        user_type = 'patient'
    except patient.DoesNotExist:
        try:
            current_therapist = therapists.objects.get(user=user)
            return JsonResponse({'error': 'Only patients can book sessions'}, status=403)
        except therapists.DoesNotExist:
            return JsonResponse({'error': 'User profile not found'}, status=404)
    
    try:
        data = request.data  # DRF automatically parses JSON
        print(f"📥 Booking data received: {data}")
        
        # Extract data
        therapist_id = data.get('therapist_id')
        reason_category = data.get('reason_category')
        reason_details = data.get('reason_details', '')
        duration_minutes = data.get('duration_minutes', 60)
        frequency = data.get('frequency', 'once')
        date_str = data.get('date')
        time_str = data.get('time')
        
        # Validation
        if not all([therapist_id, reason_category, date_str, time_str]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Check for existing active session
        active_session = Sessions.objects.filter(
            patient=current_patient,
            therapist_id=therapist_id,
            status__in=['scheduled', 'active']
        ).first()
        
        if active_session and not active_session.is_expired():
            return JsonResponse({
                'error': f'You already have an active session with this therapist on {active_session.day} at {active_session.time}.',
                'existing_session_id': active_session.id
            }, status=400)
        
        # Convert date and time
        session_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        session_time = datetime.strptime(time_str, '%H:%M').time()
        
        # Get therapist
        th = therapists.objects.get(id=therapist_id)
        
        # Determine session count
        session_counts = {
            'once': 1,
            'weekly-2': 2,
            'weekly-4': 4,
            'weekly-8': 8
        }
        session_count = session_counts.get(frequency, 1)
        
        created_sessions = []
        current_date = session_date
        
        # Create sessions
        for i in range(session_count):
            # Check availability
            existing = Sessions.objects.filter(
                therapist=th,
                day=current_date,
                time=session_time,
                status__in=['scheduled', 'active']
            ).exists()
            
            if existing:
                return JsonResponse({
                    'error': f'Time slot on {current_date} at {session_time} is already booked'
                }, status=400)
            
            # Create session
            booking = Sessions.objects.create(
                therapist=th,
                patient=current_patient,
                day=current_date,
                time=session_time,
                reason_category=reason_category,
                reason=reason_details,
                duration_minutes=duration_minutes,
                is_active=True,
                status='scheduled'
            )
            
            created_sessions.append({
                'id': booking.id,
                'date': current_date.isoformat(),
                'time': session_time.strftime('%H:%M')
            })
            
            print(f"✅ Created session {i+1}/{session_count}: {booking.id}")
            current_date += timedelta(days=7)
        
        return JsonResponse({
            'success': True,
            'message': f'{session_count} session(s) booked successfully!',
            'sessions': created_sessions
        })
        
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist not found'}, status=404)
    except ValueError as e:
        return JsonResponse({'error': f'Invalid date/time format: {str(e)}'}, status=400)
    except Exception as e:
        print(f"❌ Booking error: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def upcoming_sessions(request):
    user = request.user
    
    try:
        today = date.today()
        
        # Try to get patient profile
        try:
            current_patient = patient.objects.get(user=user)
            user_type = 'patient'
            
            sessions = Sessions.objects.filter(
                patient=current_patient,
                day__gte=today,
                status__in=['scheduled', 'active']
            ).select_related('therapist').order_by('day', 'time')
            
            sessions_data = [
                {
                    'id': s.id,
                    'date': s.day.isoformat(),
                    'time': s.time.strftime('%H:%M'),
                    'time_display': s.time.strftime('%I:%M %p'),
                    'therapist_name': f"Dr. {s.therapist.firstName} {s.therapist.lastName}",
                    'therapist_photo': s.therapist.profile_pic.url if s.therapist.profile_pic else None,
                    'reason_category': s.reason_category,
                    'reason': s.reason,
                    'duration_minutes': s.duration_minutes,
                    'status': s.status,
                    'created_at': s.created_at.isoformat()
                }
                for s in sessions
            ]
            
        except patient.DoesNotExist:
            # Try therapist
            try:
                current_therapist = therapists.objects.get(user=user)
                user_type = 'therapist'
                
                sessions = Sessions.objects.filter(
                    therapist=current_therapist,
                    day__gte=today,
                    status__in=['scheduled', 'active']
                ).select_related('patient').order_by('day', 'time')
                
                sessions_data = [
                    {
                        'id': s.id,
                        'date': s.day.isoformat(),
                        'time': s.time.strftime('%H:%M'),
                        'time_display': s.time.strftime('%I:%M %p'),
                        'patient_name': f"{s.patient.firstName} {s.patient.lastName}",
                        'patient_email': s.patient.user.email,  # From User model
                        'reason_category': s.reason_category,
                        'reason': s.reason,
                        'duration_minutes': s.duration_minutes,
                        'status': s.status,
                        'created_at': s.created_at.isoformat()
                    }
                    for s in sessions
                ]
            except therapists.DoesNotExist:
                return JsonResponse({'error': 'User profile not found'}, status=404)
        
        return JsonResponse({
            'success': True,
            'user_type': user_type,
            'upcoming_sessions': sessions_data,
            'total_count': len(sessions_data)
        })
        
    except Exception as e:
        print(f"Error fetching upcoming sessions: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def todays_sessions(request):
    user = request.user
    
    try:
        today = date.today()
        
        try:
            current_patient = patient.objects.get(user=user)
            user_type = 'patient'
            
            sessions = Sessions.objects.filter(
                patient=current_patient,
                day=today,
                status__in=['scheduled', 'active']
            ).select_related('therapist').order_by('time')
            
            sessions_data = [
                {
                    'id': s.id,
                    'time': s.time.strftime('%H:%M'),
                    'time_display': s.time.strftime('%I:%M %p'),
                    'therapist_name': f"Dr. {s.therapist.firstName} {s.therapist.lastName}",
                    'reason_category': s.reason_category,
                    'duration_minutes': s.duration_minutes,
                    'status': s.status
                }
                for s in sessions
            ]
            
        except patient.DoesNotExist:
            try:
                current_therapist = therapists.objects.get(user=user)
                user_type = 'therapist'
                
                sessions = Sessions.objects.filter(
                    therapist=current_therapist,
                    day=today,
                    status__in=['scheduled', 'active']
                ).select_related('patient').order_by('time')
                
                sessions_data = [
                    {
                        'id': s.id,
                        'time': s.time.strftime('%H:%M'),
                        'time_display': s.time.strftime('%I:%M %p'),
                        'patient_name': f"{s.patient.firstName} {s.patient.lastName}",
                        'reason_category': s.reason_category,
                        'duration_minutes': s.duration_minutes,
                        'status': s.status
                    }
                    for s in sessions
                ]
            except therapists.DoesNotExist:
                return JsonResponse({'error': 'User profile not found'}, status=404)
        
        return JsonResponse({
            'success': True,
            'date': today.isoformat(),
            'sessions': sessions_data,
            'total_count': len(sessions_data)
        })
        
    except Exception as e:
        print(f"Error fetching today's sessions: {e}")
        return JsonResponse({'error': str(e)}, status=500)
# consultation/views.py

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    try:
        user = request.user
        patient_profile = patient.objects.get(user=user)

        data = request.data

        therapist_id = data.get('therapist_id')
        reason_category = data.get('reason_category')
        reason_details = data.get('reason_details', '')
        duration_minutes = int(data.get('duration_minutes', 60))
        frequency = data.get('frequency', 'once')
        date_str = data.get('date')
        time_str = data.get('time')

        if not all([therapist_id, reason_category, date_str, time_str]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)

        therapist = therapists.objects.select_related('organization').get(id=therapist_id)
        # Validation
        if not all([therapist_id, reason_category, date_str, time_str]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        # Check for existing active session
        active_session = Sessions.objects.filter(
            patient=patient_profile,
            therapist_id=therapist_id,
            status__in=['scheduled', 'active']
        ).first()
        
        if active_session and not active_session.is_expired():
            return JsonResponse({
                'error': f'You already have an active session with this therapist on {active_session.day} at {active_session.time}.',
                'existing_session_id': active_session.id
            }, status=400)
        

        session_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        session_time = datetime.strptime(time_str, '%H:%M').time()

        # Frequency handling
        session_counts = {
            'once': 1,
            'weekly-2': 2,
            'weekly-4': 4,
            'weekly-8': 8
        }
        session_count = session_counts.get(frequency, 1)

        created_sessions = []
        current_date = session_date

        # Generate ONE booking reference for all sessions
        booking_reference = f"HS-{uuid.uuid4().hex[:8].upper()}"

        # ============================================
        # DETERMINE IF SESSION IS FREE
        # ============================================
        is_free = False
        if patient_profile.organization and therapist.organization:
            # Both have organizations - check if same
            is_free = (patient_profile.organization.id == therapist.organization.id)
        
        # ============================================
        # CALCULATE PRICING
        # ============================================
        if is_free:
            price_per_session = 0
        elif therapist.organization:
            # Organization therapist accepting public patients
            base_rate = float(therapist.organization.public_session_rate) if hasattr(therapist.organization, 'public_session_rate') else 4000.0
            # Apply duration multiplier
            if duration_minutes == 45:
                price_per_session = base_rate * 0.75
            else:
                price_per_session = base_rate
        else:
            # Independent therapist
            if duration_minutes == 45:
                price_per_session = float(therapist.session_rate_45) if hasattr(therapist, 'session_rate_45') else 2500.0
            else:
                price_per_session = float(therapist.session_rate_60) if hasattr(therapist, 'session_rate_60') else 3000.0

        total_cost = price_per_session * session_count

        print("\n" + "="*60)
        print("CREATE SESSION - PRICING")
        print("="*60)
        print(f"Patient: {patient_profile.firstName} (Org: {patient_profile.organization.name if patient_profile.organization else 'Independent'})")
        print(f"Therapist: Dr. {therapist.firstName} (Org: {therapist.organization.name if therapist.organization else 'Independent'})")
        print(f"Is Free: {is_free}")
        print(f"Duration: {duration_minutes} minutes")
        print(f"Price per session: KES {price_per_session}")
        print(f"Number of sessions: {session_count}")
        print(f"Total cost: KES {total_cost}")
        print("="*60 + "\n")

        # Create sessions
        for i in range(session_count):
            # Check availability
            exists = Sessions.objects.filter(
                therapist=therapist,
                day=current_date,
                time=session_time,
                status__in=['scheduled', 'active']
            ).exists()

            if exists:
                return JsonResponse({
                    'error': f"Slot already booked on {current_date}"
                }, status=400)

            booking = Sessions.objects.create(
                therapist=therapist,
                patient=patient_profile,
                day=current_date,
                time=session_time,
                reason_category=reason_category,
                reason=reason_details,
                duration_minutes=duration_minutes,
                status='scheduled'
            )

            created_sessions.append(booking)
            current_date += timedelta(days=7)

        # ============================================
        # SEND EMAIL
        # ============================================
        email_data = {
            'patient_email': user.email,
            'patient_name': f"{patient_profile.firstName} {patient_profile.lastName}",
            'therapist_name': f"Dr. {therapist.firstName} {therapist.lastName}",
            'therapist_specialty': therapist.specialty_1 or 'General Therapy',
            'session_date': date_str,
            'session_time': time_str,
            'duration_minutes': duration_minutes,
            'session_cost': total_cost,
            'is_free': is_free,
            'organization_name': patient_profile.organization.name if patient_profile.organization else None,
            'booking_reference': booking_reference,
            'reason_category': reason_category
        }

        send_booking_confirmation_email(email_data)

        return JsonResponse({
            'success': True,
            'message': f'{session_count} session(s) booked',
            'booking_reference': booking_reference,
            'is_free': is_free,
            'total_cost': total_cost
        })

    except patient.DoesNotExist:
        return JsonResponse({'error': 'Patient profile not found'}, status=404)
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist not found'}, status=404)
    except Exception as e:
        print("❌ Error:", e)
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)