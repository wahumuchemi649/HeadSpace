from django.db import models
from django.utils import timezone
from therapy.models import  therapists
from patients.models import  patient  # assuming you have a patients app
from consultation.models import Sessions

class Message(models.Model):
    session = models.ForeignKey(Sessions, on_delete=models.CASCADE, related_name="messages")
    sender_patient = models.ForeignKey(patient, on_delete=models.CASCADE, null=True, blank=True, related_name="sent_messages")
    sender_therapist = models.ForeignKey(therapists, on_delete=models.CASCADE, null=True, blank=True, related_name="sent_messages")
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)


    def __str__(self):
        return f"Message from {self.sender} to {self.therapist} at {self.timestamp}"


# Create your models here.
