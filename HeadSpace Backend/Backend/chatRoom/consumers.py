'''import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message
from therapy.models import therapists
from patients.models import patient
from consultation.models import Sessions

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f"chat_{self.session_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        sender_id = data['sender_id']
        therapist_id = data['therapist_id']

        # Save message to database
        msg = Message.objects.create(
            content=message,
            sender_id=sender_id,
            therapist_id=therapist_id,
            session_id=self.session_id
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': msg.content,
                'sender_id': msg.sender_id,
                'therapist_id': msg.therapist_id,
                'timestamp': str(msg.timestamp)
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'therapist_id': event['therapist_id'],
            'timestamp': event['timestamp'],
        }))
'''
# chat/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Get token from query string
        query_string = self.scope['query_string'].decode()
        token = None
        
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        if not token:
            await self.close()
            return
        
        try:
            # Verify JWT token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.scope['user'] = await self.get_user(user_id)
            
            # Rest of your connect logic
            self.session_id = self.scope['url_route']['kwargs']['session_id']
            # ...
            
            await self.accept()
        except Exception as e:
            print(f"WebSocket auth failed: {e}")
            await self.close()
    
    async def get_user(self, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return await User.objects.aget(id=user_id)