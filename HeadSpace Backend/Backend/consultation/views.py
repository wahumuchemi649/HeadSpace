from django.conf import settings
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Sessions
from therapy.models import therapists
from patients.models import patient
from datetime import datetime, timedelta
import json


@csrf_exempt
def session(request):
    if request.method == "POST":
        # Debug session
        print(f"🔍 SESSION DEBUG:")
        print(f"Session key: {request.session.session_key}")
        print(f"Session data: {dict(request.session.items())}")
        
        # Get patient from session
        patient_id = request.session.get('patient_id')
        user_type = request.session.get('user_type')
        
        if user_type != 'patient':
            return JsonResponse({'error': 'Only patients can book sessions'}, status=403)
        
        if not patient_id:
            return JsonResponse({'error': 'Please login first'}, status=401)
        
        try:
            data = json.loads(request.body)
            print(f"📥 Booking data received: {data}")
            
            # Extract data
            therapist_id = data.get('therapist_id')
            reason_category = data.get('reason_category')
            reason_details = data.get('reason_details', '')
            duration_minutes = data.get('duration_minutes', 60)
            frequency = data.get('frequency', 'once')
            date_str = data.get('date')  # YYYY-MM-DD
            time_str = data.get('time')  # HH:MM
            
            # Validation
            if not all([therapist_id, reason_category, date_str, time_str]):
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            # Convert date and time
            session_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            session_time = datetime.strptime(time_str, '%H:%M').time()
            
            # Get therapist and patient
            th = therapists.objects.get(id=therapist_id)
            current_patient = patient.objects.get(id=patient_id)
            
            # Determine how many sessions to create
            if frequency == 'once':
                session_count = 1
            elif frequency == 'weekly-2':
                session_count = 2
            elif frequency == 'weekly-4':
                session_count = 4
            elif frequency == 'weekly-8':
                session_count = 8
            else:
                session_count = 1
            
            created_sessions = []
            current_date = session_date
            
            # Create sessions
            for i in range(session_count):
                # Check if slot is available
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
                
                # Move to next week for recurring sessions
                current_date += timedelta(days=7)
            
            return JsonResponse({
                'success': True,
                'message': f'{session_count} session(s) booked successfully!',
                'sessions': created_sessions
            })
            
        except therapists.DoesNotExist:
            return JsonResponse({'error': 'Therapist not found'}, status=404)
        except patient.DoesNotExist:
            return JsonResponse({'error': 'Patient not found'}, status=404)
        except ValueError as e:
            return JsonResponse({'error': f'Invalid date/time format: {str(e)}'}, status=400)
        except Exception as e:
            print(f"❌ Booking error: {e}")
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)