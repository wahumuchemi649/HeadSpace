from django.db import models
from django.contrib import admin
from therapy.models import therapists
from patients.models import patient


class Sessions(models.Model):
    therapist = models.ForeignKey(therapists, on_delete=models.CASCADE, null=True, related_name='sessions')
    patient = models.ForeignKey(patient, on_delete=models.CASCADE, null=True, related_name='sessions')
    
    # Booking details
    day = models.DateField()  # ✅ Changed from CharField to DateField
    time = models.TimeField()
    
    # Reason
    reason_category = models.CharField(max_length=50, default='other')  # ✅ Add category
    reason = models.TextField(default='')  # Optional details
    
    # Session options
    duration_minutes = models.IntegerField(default=60)  # ✅ Add duration
    
    # Status
    is_active = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('scheduled', 'Scheduled'),
            ('active', 'Active'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled')
        ],
        default='scheduled'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} with {self.therapist} on {self.day} at {self.time}"


@admin.register(Sessions)
class SessionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'day', 'time', 'therapist', 'patient', 'status', 'reason_category')
    list_filter = ('status', 'day', 'therapist')
    search_fields = ('patient__email', 'therapist__firstName', 'reason')