# chat/views.py
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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        user = self.request.user
        
        # Verify user has access to this session
        try:
            session = Sessions.objects.get(id=session_id)
            
            # Check if user is the patient or therapist in this session
            has_access = False
            
            # Check if user is a patient
            try:
                user_patient = patient.objects.get(user=user)
                if session.patient == user_patient:
                    has_access = True
            except patient.DoesNotExist:
                pass
            
            # Check if user is a therapist
            try:
                user_therapist = therapists.objects.get(user=user)
                if session.therapist == user_therapist:
                    has_access = True
            except therapists.DoesNotExist:
                pass
            
            if not has_access:
                return Message.objects.none()
                
        except Sessions.DoesNotExist:
            return Message.objects.none()
        
        return Message.objects.filter(session_id=session_id).order_by('timestamp')
    
    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        session = get_object_or_404(Sessions, id=session_id)
        user = self.request.user
        
        # Try to get patient profile
        try:
            user_patient = patient.objects.get(user=user)
            # Verify patient belongs to this session
            if session.patient != user_patient:
                raise PermissionError("You don't have access to this session")
            serializer.save(
                session=session,
                sender_patient=user_patient,
                sender_therapist=None
            )
            return
        except patient.DoesNotExist:
            pass
        
        # Try to get therapist profile
        try:
            user_therapist = therapists.objects.get(user=user)
            # Verify therapist belongs to this session
            if session.therapist != user_therapist:
                raise PermissionError("You don't have access to this session")
            serializer.save(
                session=session,
                sender_patient=None,
                sender_therapist=user_therapist
            )
            return
        except therapists.DoesNotExist:
            pass
        
        # If we get here, user is neither patient nor therapist
        raise PermissionError("User profile not found")


class UserSessionsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        sessions = []
        
        # Try to get as patient
        try:
            user_patient = patient.objects.get(user=user)
            sessions = Sessions.objects.filter(
                patient=user_patient,
                is_active=True
            ).select_related('therapist').values(
                'id',
                'therapist__firstName',
                'therapist__lastName',
                'created_at',
                'day',
                'time'
            )
            return Response(list(sessions))
        except patient.DoesNotExist:
            pass
        
        # Try to get as therapist
        try:
            user_therapist = therapists.objects.get(user=user)
            sessions = Sessions.objects.filter(
                therapist=user_therapist,
                is_active=True
            ).select_related('patient').values(
                'id',
                'patient__firstName',
                'patient__lastName',
                'created_at',
                'day',
                'time'
            )
            return Response(list(sessions))
        except therapists.DoesNotExist:
            pass
        
        return Response({'error': 'User profile not found'}, status=404)