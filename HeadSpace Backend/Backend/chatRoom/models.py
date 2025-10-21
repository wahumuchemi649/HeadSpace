from django.db import models
from django.utils import timezone
from therapy.models import  therapists
from patients.models import  patient  # assuming you have a patients app

class Message(models.Model):
    sender = models.ForeignKey(patient, on_delete=models.CASCADE, related_name="sent_messages", null=True, blank=True)
    therapist = models.ForeignKey(therapists, on_delete=models.CASCADE, related_name="received_messages", null=True, blank=True)
    session = models.ForeignKey('consultation.Sessions', on_delete=models.CASCADE, null=True, blank=True)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Message from {self.sender} to {self.therapist} at {self.timestamp}"


# Create your models here.
