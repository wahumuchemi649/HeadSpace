from django.db import models
from consultation.models import Sessions

class Messages(models.Model):
    session = models.ForeignKey(Sessions, on_delete=models.CASCADE, related_name='messages')
    sender_id = models.IntegerField()
    sender_type = models.CharField(max_length=20)  # 'patient' or 'therapist'
    message_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True) 
    is_read=models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender_type} ({self.sender_id}): {self.message_text[:30]}"

class SessionNotes(models.Model):
    session = models.OneToOneField(Sessions, on_delete=models.CASCADE, related_name='notes')
    user_id = models.IntegerField()  # Who wrote the notes
    user_type = models.CharField(max_length=20)  # 'patient' or 'therapist'
    content = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'user_id', 'user_type')

    def __str__(self):
        return f"Notes by {self.user_type} ({self.user_id}) for session {self.session.id}"


