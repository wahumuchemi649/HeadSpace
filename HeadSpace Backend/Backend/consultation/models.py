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
            ('expired', 'Expired'),
            ('cancelled', 'Cancelled')
        ],
        default='scheduled'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} with {self.therapist} on {self.day} at {self.time}"
    
    def is_expired(self):
        """Check if session has passed its end time"""
        from datetime import datetime, timedelta
        
        # Combine date and time
        session_datetime = datetime.combine(self.day, self.time)
        
        # Add duration to get end time
        session_end = session_datetime + timedelta(minutes=self.duration_minutes)
        
        # Check if current time is past session end
        now = datetime.now()
        return now > session_end
    
    def can_access_chat(self):
        """Check if chat room can be accessed"""
        from datetime import datetime, timedelta
        
        session_datetime = datetime.combine(self.day, self.time)
        session_end = session_datetime + timedelta(minutes=self.duration_minutes)
        
        # Allow access 5 minutes before session starts, until session ends
        access_start = session_datetime - timedelta(minutes=5)
        now = datetime.now()
        
        return access_start <= now <= session_end


@admin.register(Sessions)
class SessionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'day', 'time', 'therapist', 'patient', 'status', 'reason_category')
    list_filter = ('status', 'day', 'therapist')
    search_fields = ('patient__email', 'therapist__firstName', 'reason')