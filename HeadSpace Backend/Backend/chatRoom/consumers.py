import json
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
