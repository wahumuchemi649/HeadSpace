from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'therapist', 'session', 'content', 'timestamp', 'is_read', 'sender_name', 'sender_type']
        read_only_fields = ['timestamp']
    
    def get_sender_name(self, obj):
        if obj.sender:
            return f"{obj.sender.user.first_name} {obj.sender.user.last_name}" if hasattr(obj.sender, 'user') else str(obj.sender)
        return "Unknown"
    
    def get_sender_type(self, obj):
        # Determine who sent the message
        if obj.sender:
            return 'patient'
        return 'therapist'