import json
from .models import Messages, SessionNotes
from consultation.models import Sessions
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from patients.models import patient
from therapy.models import therapists


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, session_id):
    print("\n" + "="*60)
    print("SEND_MESSAGE DEBUG")
    print("="*60)
    
    user = request.user
    message_text = request.data.get('message')
    
    # Determine user type and get profile
    try:
        user_patient = patient.objects.get(user=user)
        user_type = 'patient'
        user_id = user_patient.id
    except patient.DoesNotExist:
        try:
            user_therapist = therapists.objects.get(user=user)
            user_type = 'therapist'
            user_id = user_therapist.id
        except therapists.DoesNotExist:
            return JsonResponse({'error': 'User profile not found'}, status=404)
    
    try:
        session_obj = Sessions.objects.get(id=session_id)
    except Sessions.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)
    
    # Security check
    if user_type == 'patient' and session_obj.patient.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    if user_type == 'therapist' and session_obj.therapist.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Save message
    msg = Messages.objects.create(
        session=session_obj,
        sender_id=user_id,
        sender_type=user_type,
        message_text=message_text
    )
    
    # Broadcast to WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{session_id}',
        {
            'type': 'chat_message',
            'message': {
                'id': msg.id,
                'sender_type': msg.sender_type,
                'sender_id': msg.sender_id,
                'message': msg.message_text,
                'created_at': msg.created_at.isoformat(),
                'is_read': msg.is_read,
            }
        }
    )
    
    return JsonResponse({'message': 'Message sent', 'id': msg.id})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, session_id):
    """Get messages - with option to show all sessions or just this one"""
    user = request.user
    show_all = request.GET.get('show_all', 'false').lower() == 'true'
    
    # Determine user type
    try:
        user_patient = patient.objects.get(user=user)
        user_type = 'patient'
        user_id = user_patient.id
    except patient.DoesNotExist:
        try:
            user_therapist = therapists.objects.get(user=user)
            user_type = 'therapist'
            user_id = user_therapist.id
        except therapists.DoesNotExist:
            return JsonResponse({'error': 'User profile not found'}, status=404)
    
    try:
        current_session = Sessions.objects.get(id=session_id)
    except Sessions.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)
    
    # Ownership check
    if user_type == 'patient' and current_session.patient.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    if user_type == 'therapist' and current_session.therapist.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Get messages
    if show_all:
        # Get all sessions between this patient and therapist
        all_sessions = Sessions.objects.filter(
            patient=current_session.patient,
            therapist=current_session.therapist
        ).order_by('day', 'time').values_list('id', flat=True)
        
        messages = Messages.objects.filter(
            session_id__in=all_sessions
        ).select_related('session').order_by('created_at')
        
        # Build response with session grouping info
        data = []
        last_session_id = None
        
        for msg in messages:
            # Add session marker if this is a new session
            if msg.session_id != last_session_id:
                data.append({
                    'type': 'session_marker',
                    'session_id': msg.session_id,
                    'session_date': msg.session.day.isoformat(),
                    'session_time': msg.session.time.strftime('%H:%M'),
                })
                last_session_id = msg.session_id
            
            data.append({
                'type': 'message',
                'id': msg.id,
                'sender_type': msg.sender_type,
                'sender_id': msg.sender_id,
                'message': msg.message_text,
                'created_at': msg.created_at.isoformat(),
                'is_read': msg.is_read,
                'session_id': msg.session_id,
            })
    else:
        # Get only messages from current session
        messages = Messages.objects.filter(
            session_id=session_id
        ).order_by('created_at')
        
        data = [
            {
                'type': 'message',
                'id': msg.id,
                'sender_type': msg.sender_type,
                'sender_id': msg.sender_id,
                'message': msg.message_text,
                'created_at': msg.created_at.isoformat(),
                'is_read': msg.is_read,
                'session_id': session_id,
            }
            for msg in messages
        ]
    
    # Mark unread messages as read (only in current session)
    Messages.objects.filter(
        session_id=session_id,
        is_read=False
    ).exclude(sender_type=user_type).update(is_read=True)
    
    return JsonResponse({
        'messages': data,
        'current_session_id': session_id,
        'show_all': show_all
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_sessions(request):
    user = request.user
    
    # Determine user type
    try:
        user_patient = patient.objects.get(user=user)
        user_type = 'patient'
        user_id = user_patient.id
        sessions = Sessions.objects.filter(patient=user_patient)
    except patient.DoesNotExist:
        try:
            user_therapist = therapists.objects.get(user=user)
            user_type = 'therapist'
            user_id = user_therapist.id
            sessions = Sessions.objects.filter(therapist=user_therapist)
        except therapists.DoesNotExist:
            return JsonResponse({'error': 'User profile not found'}, status=404)
    
    data = []
    for s in sessions:
        is_expired = s.is_expired()
        can_access = s.can_access_chat()
        
        last_msg = (
            s.messages
            .only('message_text', 'created_at')
            .order_by('-created_at')
            .first()
        )
        
        unread_count = s.messages.filter(
            is_read=False
        ).exclude(sender_type=user_type).count()
        
        # ✅ FIX: Update status to 'completed' if expired
        if is_expired:
            if s.status != 'completed':
                s.status = 'completed'
                s.save()
            display_message = "⚠️ Session completed"
        elif not can_access:
            display_message = "Session not yet started"
        else:
            display_message = last_msg.message_text if last_msg else "No messages yet"
        
        data.append({
            "id": s.id,
            "other_party": (
                s.therapist.firstName if user_type == 'patient'
                else s.patient.firstName
            ),
            "last_message": display_message,
            "last_message_time": last_msg.created_at.isoformat() if last_msg else None,
            "unread_count": unread_count,
            "is_expired": is_expired,
            "can_access": can_access,
            "status": s.status,  # ✅ Now returns 'completed' for expired sessions
            "session_date": s.day.isoformat(),
            "session_time": s.time.strftime('%H:%M'),
            "created_at": s.created_at.isoformat(),
        })
    
    return JsonResponse(data, safe=False)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_session_access(request, session_id):
    """Check if user can access this chat session"""
    user = request.user
    
    # Determine user type
    try:
        user_patient = patient.objects.get(user=user)
        user_type = 'patient'
        user_id = user_patient.id
    except patient.DoesNotExist:
        try:
            user_therapist = therapists.objects.get(user=user)
            user_type = 'therapist'
            user_id = user_therapist.id
        except therapists.DoesNotExist:
            return JsonResponse({'error': 'User profile not found', 'can_access': False}, status=404)
    
    try:
        session_obj = Sessions.objects.get(id=session_id)
    except Sessions.DoesNotExist:
        return JsonResponse({'error': 'Session not found', 'can_access': False}, status=404)
    
    # Security check
    if user_type == 'patient' and session_obj.patient.id != user_id:
        return JsonResponse({'error': 'Unauthorized', 'can_access': False}, status=403)
    if user_type == 'therapist' and session_obj.therapist.id != user_id:
        return JsonResponse({'error': 'Unauthorized', 'can_access': False}, status=403)
    
    # Check if session can be accessed
    if session_obj.is_expired():
        return JsonResponse({
            'can_access': False,
            'message': 'This session has expired. Please book a new session.',
            'is_expired': True
        })
    
    if not session_obj.can_access_chat():
        return JsonResponse({
            'can_access': False,
            'message': 'This session has not started yet.',
            'is_expired': False
        })
    
    return JsonResponse({
        'can_access': True,
        'message': 'Session is active'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notes(request, session_id):
    """Get notes for a specific session"""
    user = request.user
    
    # Determine user type
    try:
        user_patient = patient.objects.get(user=user)
        user_type = 'patient'
        user_id = user_patient.id
    except patient.DoesNotExist:
        try:
            user_therapist = therapists.objects.get(user=user)
            user_type = 'therapist'
            user_id = user_therapist.id
        except therapists.DoesNotExist:
            return JsonResponse({'error': 'User profile not found'}, status=404)
    
    try:
        session_obj = Sessions.objects.get(id=session_id)
    except Sessions.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)
    
    # Security check
    if user_type == 'patient' and session_obj.patient.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    if user_type == 'therapist' and session_obj.therapist.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    # Get or create notes
    notes, created = SessionNotes.objects.get_or_create(
        session=session_obj,
        user_id=user_id,
        user_type=user_type,
        defaults={'content': ''}
    )
    
    return JsonResponse({
        'content': notes.content,
        'updated_at': notes.updated_at.isoformat()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_notes(request, session_id):
    """Save notes for a specific session"""
    user = request.user
    
    # Determine user type
    try:
        user_patient = patient.objects.get(user=user)
        user_type = 'patient'
        user_id = user_patient.id
    except patient.DoesNotExist:
        try:
            user_therapist = therapists.objects.get(user=user)
            user_type = 'therapist'
            user_id = user_therapist.id
        except therapists.DoesNotExist:
            return JsonResponse({'error': 'User profile not found'}, status=404)
    
    try:
        session_obj = Sessions.objects.get(id=session_id)
    except Sessions.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)
    
    # Security check
    if user_type == 'patient' and session_obj.patient.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    if user_type == 'therapist' and session_obj.therapist.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    content = request.data.get('content', '')
    
    # Update or create notes
    notes, created = SessionNotes.objects.update_or_create(
        session=session_obj,
        user_id=user_id,
        user_type=user_type,
        defaults={'content': content}
    )
    
    return JsonResponse({
        'message': 'Notes saved successfully',
        'updated_at': notes.updated_at.isoformat()
    })