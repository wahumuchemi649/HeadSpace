# chatRoom/views.py
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Message
from .serializers import MessageSerializer
from consultation.models import Sessions
from patients.models import patient
from therapy.models import therapists

class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]  # Require authentication

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        user = self.request.user
        
        # Verify user has access to this session
        try:
            session = Sessions.objects.get(id=session_id)
            
            # Check if user is the patient or therapist in this session
            has_access = False
            if hasattr(user, 'patient') and session.patient == user.patient:
                has_access = True
            elif hasattr(user, 'therapists') and session.therapist == user.therapists:
                has_access = True
            
            if not has_access:
                return Message.objects.none()
                
        except Sessions.DoesNotExist:
            return Message.objects.none()
        
        return Message.objects.filter(session_id=session_id).order_by('timestamp')
    
    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        session = get_object_or_404(Sessions, id=session_id)
        user = self.request.user
        
        # Automatically detect if user is patient or therapist
        if hasattr(user, 'patient'):
            # User is a patient
            if session.patient != user.patient:
                raise PermissionError("You don't have access to this session")
            serializer.save(
                session=session, 
                sender_patient=user.patient, 
                sender_therapist=session.therapist
            )
        elif hasattr(user, 'therapists'):
            # User is a therapist
            if session.therapist != user.therapists:
                raise PermissionError("You don't have access to this session")
            serializer.save(
                session=session, 
                sender=None, 
                sender_therapist=user.therapists
            )
        else:
            raise PermissionError("User is neither patient nor therapist")


# Get user's active sessions
class UserSessionsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        sessions = []
        
        if hasattr(user, 'patient'):
            # Get patient's sessions
            sessions = Sessions.objects.filter(
                patient=user.patient,
                is_active=True
            ).values('id', 'therapist__user__first_name', 'therapist__user__last_name', 'created_at')
            
        elif hasattr(user, 'therapists'):
            # Get therapist's sessions
            sessions = Sessions.objects.filter(
                therapist=user.therapists,
                is_active=True
            ).values('id', 'patient__user__first_name', 'patient__user__last_name', 'created_at')
        
        return Response(sessions)