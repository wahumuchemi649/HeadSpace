from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import User
from consultation.models import Sessions
from patients.models import patient
from therapy.models import therapists
import json


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'chat_{self.session_id}'
        
        # Extract token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=', 1)[1]
                break
        
        if not token:
            print("❌ No token provided")
            await self.close()
            return
        
        try:
            # Verify JWT token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user from database
            user = await self.get_user(user_id)
            if not user:
                print(f"❌ User {user_id} not found")
                await self.close()
                return
            
            # Store user in scope
            self.scope['user'] = user
            self.user = user
            
            # Verify user has access to this session
            has_access = await self.verify_session_access(self.session_id, user)
            if not has_access:
                print(f"❌ User {user_id} has no access to session {self.session_id}")
                await self.close()
                return
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            print(f"✅ WebSocket connected: User {user_id} joined session {self.session_id}")
            
        except (InvalidToken, TokenError) as e:
            print(f"❌ Invalid token: {e}")
            await self.close()
        except Exception as e:
            print(f"❌ Connection error: {e}")
            await self.close()
    
    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        print(f"WebSocket disconnected: {close_code}")
    
    # Receive message from WebSocket
    async def receive_json(self, content):
        message = content.get('message', '')
        
        if not message:
            return
        
        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': self.user.id,
            }
        )
    
    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send_json({
            'type': 'new_message',
            'message': event.get('message'),
        })
    
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def verify_session_access(self, session_id, user):
        try:
            session = Sessions.objects.get(id=session_id)
            
            # Check if user is the patient
            try:
                user_patient = patient.objects.get(user=user)
                if session.patient.id == user_patient.id:
                    return True
            except patient.DoesNotExist:
                pass
            
            # Check if user is the therapist
            try:
                user_therapist = therapists.objects.get(user=user)
                if session.therapist.id == user_therapist.id:
                    return True
            except therapists.DoesNotExist:
                pass
            
            return False
            
        except Sessions.DoesNotExist:
            return False