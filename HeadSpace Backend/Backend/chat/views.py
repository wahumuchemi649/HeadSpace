import json
from .models import Messages
from consultation.models import Sessions
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@csrf_exempt
def send_message(request, session_id):
    print("\n" + "="*60)
    print("SEND_MESSAGE DEBUG")
    print("="*60)
    
    data = json.loads(request.body)
    message_text = data.get('message')

    user_type = request.session.get('user_type')
    user_id = request.session.get('patient_id') if user_type == 'patient' else request.session.get('therapist_id')

    if not user_id:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    session_obj = Sessions.objects.get(id=session_id)

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


@csrf_exempt
def get_messages(request, session_id):
    print("\n" + "="*60)
    print("GET_MESSAGES DEBUG")
    print("="*60)
    print("REQUEST PATH:", request.path)
    print("Cookies received:", request.COOKIES.keys())
    print("Has sessionid cookie?", 'sessionid' in request.COOKIES)
    
    if hasattr(request, 'session'):
        print("Session key:", request.session.session_key)
        print("Session items:", dict(request.session.items()))
    
    print("="*60 + "\n")
    
    if request.method != "GET":
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user_type = request.session.get('user_type')
    if not user_type:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    user_id = (
        request.session.get('patient_id')
        if user_type == 'patient'
        else request.session.get('therapist_id')
    )

    try:
        session_obj = Sessions.objects.get(id=session_id)
    except Sessions.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)

    # Ownership check
    if user_type == 'patient' and session_obj.patient.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    if user_type == 'therapist' and session_obj.therapist.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    # 🔹 Fetch messages
    messages = Messages.objects.filter(
        session=session_obj
    ).order_by('created_at')

    # 🔹 Mark unread messages as read (only those not sent by current user)
    Messages.objects.filter(
        session=session_obj,
        is_read=False
    ).exclude(sender_type=user_type).update(is_read=True)

    data = [
        {
            'id': msg.id,
            'sender_type': msg.sender_type,
            'sender_id': msg.sender_id,
            'message': msg.message_text,
            'created_at': msg.created_at,
            'is_read': msg.is_read,
        }
        for msg in messages
    ]

    return JsonResponse({'messages': data})
@never_cache
@csrf_exempt
def my_sessions(request):
    

    if request.method != "GET":
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    print("MY SESSIONS HIT", dict(request.session.items()))

    user_type = request.session.get('user_type')
    if not user_type:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    if user_type == 'patient':
        user_id = request.session.get('patient_id')
        sessions = Sessions.objects.filter(patient_id=user_id)
    else:
        user_id = request.session.get('therapist_id')
        sessions = Sessions.objects.filter(therapist_id=user_id)

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

        if is_expired and s.status != 'completed':
            # Auto-update status to expired
            s.status = 'expired'
            s.save()
            display_message = "⚠️ Subscription expired - Please renew"
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
            "last_message_time": last_msg.created_at if last_msg else None,
            "unread_count": unread_count,
            "is_expired": is_expired,  
            "can_access": can_access,  
            "status": s.status,
        })

    return JsonResponse(data, safe=False)

@csrf_exempt
def check_session_access(request, session_id):
    """Check if user can access this chat session"""
    
    user_type = request.session.get('user_type')
    if not user_type:
        return JsonResponse({'error': 'Not authenticated', 'can_access': False}, status=401)
    
    user_id = (
        request.session.get('patient_id')
        if user_type == 'patient'
        else request.session.get('therapist_id')
    )
    
    try:
        session_obj = Sessions.objects.get(id=session_id)
    except Sessions.DoesNotExist:
        return JsonResponse({'error': 'Session not found', 'can_access': False}, status=404)
    
    # Security check - is this their session?
    if user_type == 'patient' and session_obj.patient.id != user_id:
        return JsonResponse({'error': 'Unauthorized', 'can_access': False}, status=403)
    if user_type == 'therapist' and session_obj.therapist.id != user_id:
        return JsonResponse({'error': 'Unauthorized', 'can_access': False}, status=403)
    
    # ✅ Check if session can be accessed
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

# Add these to your views.py

@csrf_exempt
def get_notes(request, session_id):
    """Get notes for a specific session"""
    
    if request.method != "GET":
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    user_type = request.session.get('user_type')
    if not user_type:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    user_id = (
        request.session.get('patient_id')
        if user_type == 'patient'
        else request.session.get('therapist_id')
    )
    
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


@csrf_exempt
def save_notes(request, session_id):
    """Save notes for a specific session"""
    
    if request.method != "POST":
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    user_type = request.session.get('user_type')
    if not user_type:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    user_id = (
        request.session.get('patient_id')
        if user_type == 'patient'
        else request.session.get('therapist_id')
    )
    
    try:
        session_obj = Sessions.objects.get(id=session_id)
    except Sessions.DoesNotExist:
        return JsonResponse({'error': 'Session not found'}, status=404)
    
    # Security check
    if user_type == 'patient' and session_obj.patient.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    if user_type == 'therapist' and session_obj.therapist.id != user_id:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    data = json.loads(request.body)
    content = data.get('content', '')
    
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
