from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class therapists(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)  # Add this
    firstName = models.CharField(max_length=255,default='xxxx')
    lastName=models.CharField(max_length=255, default='xxxx')
    phoneNumber=models.CharField(max_length=15, null=True, blank=True)
    description=models.CharField(max_length=400,default="A certified Therapist")
    profile_pic=models.ImageField(upload_to="therapists/")

    # ✅ Add specialties (max 3)
    specialty_1 = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('academic_pressure', 'Academic Pressure'),
        ('anger_management', 'Anger Management'),
        ('anxiety_stress', 'Anxiety / Stress'),
        ('burnout', 'Burnout / Work-related Stress'),
        ('chronic_illness', 'Chronic Illness'),
        ('depression', 'Depression'),
        ('family_problems', 'Family Problems'),
        ('grief_loss', 'Grief / Loss'),
        ('identity_issues', 'Identity Issues'),
        ('life_transitions', 'Life Transitions'),
        ('parenting_issues', 'Parenting Challenges'),
        ('relationship_issues', 'Relationship Issues'),
        ('self_esteem', 'Self-esteem Issues'),
        ('sleep_issues', 'Sleep Problems'),
        ('social_anxiety', 'Social Anxiety'),
        ('substance_use', 'Substance Use'),
        ('trauma_ptsd', 'Trauma / PTSD'),
        ('other', 'Other'),
    ])
    
    specialty_2 = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('academic_pressure', 'Academic Pressure'),
        ('anger_management', 'Anger Management'),
        ('anxiety_stress', 'Anxiety / Stress'),
        ('burnout', 'Burnout / Work-related Stress'),
        ('chronic_illness', 'Chronic Illness'),
        ('depression', 'Depression'),
        ('family_problems', 'Family Problems'),
        ('grief_loss', 'Grief / Loss'),
        ('identity_issues', 'Identity Issues'),
        ('life_transitions', 'Life Transitions'),
        ('parenting_issues', 'Parenting Challenges'),
        ('relationship_issues', 'Relationship Issues'),
        ('self_esteem', 'Self-esteem Issues'),
        ('sleep_issues', 'Sleep Problems'),
        ('social_anxiety', 'Social Anxiety'),
        ('substance_use', 'Substance Use'),
        ('trauma_ptsd', 'Trauma / PTSD'),
        ('other', 'Other'),
    ])
    
    specialty_3 = models.CharField(max_length=50, blank=True, null=True, choices=[
        ('academic_pressure', 'Academic Pressure'),
        ('anger_management', 'Anger Management'),
        ('anxiety_stress', 'Anxiety / Stress'),
        ('burnout', 'Burnout / Work-related Stress'),
        ('chronic_illness', 'Chronic Illness'),
        ('depression', 'Depression'),
        ('family_problems', 'Family Problems'),
        ('grief_loss', 'Grief / Loss'),
        ('identity_issues', 'Identity Issues'),
        ('life_transitions', 'Life Transitions'),
        ('parenting_issues', 'Parenting Challenges'),
        ('relationship_issues', 'Relationship Issues'),
        ('self_esteem', 'Self-esteem Issues'),
        ('sleep_issues', 'Sleep Problems'),
        ('social_anxiety', 'Social Anxiety'),
        ('substance_use', 'Substance Use'),
        ('trauma_ptsd', 'Trauma / PTSD'),
        ('other', 'Other'),
    ])
    def __str__(self):
        return f"{self.firstName}     {self.lastName}       {self.description}"
    def get_specialties(self):
        """Return list of therapist's specialties"""
        specialties = []
        if self.specialty_1:
            specialties.append(self.specialty_1)
        if self.specialty_2:
            specialties.append(self.specialty_2)
        if self.specialty_3:
            specialties.append(self.specialty_3)
        return specialties

'''class patients(models.Model):
    firstName=models.CharField(max_length=255,default='xxxx')
    lastName=models.CharField(max_length=255,default='xxxx')
    phoneNumber=models.IntegerField(null=False)
    email=models.EmailField(max_length=255,default='xxxx@gmail.com')

    def __str__(self):
        return f"{self.email} {self.phoneNumber}"'''
    

# chat/models.py or consultation/models.py

class TherapistAvailability(models.Model):
    therapist = models.ForeignKey('therapy.therapists', on_delete=models.CASCADE, related_name='availability_slots')
    day_of_week = models.IntegerField(choices=[
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ])
    time_slot = models.TimeField()  # e.g., 09:00, 10:00, 14:00
    is_available = models.BooleanField(default=True)  # Therapist toggles this
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['therapist', 'day_of_week', 'time_slot']
        ordering = ['day_of_week', 'time_slot']
    
    def __str__(self):
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        status = 'Available' if self.is_available else 'Unavailable'
        return f"{days[self.day_of_week]} {self.time_slot} - {status}"
    
    def is_booked(self):
        """Check if this slot has a booked session"""
        from consultation.models import Sessions
        from datetime import datetime, timedelta
        
        # Get next occurrence of this day
        today = datetime.now().date()
        days_ahead = self.day_of_week - today.weekday()
        if days_ahead < 0:
            days_ahead += 7
        next_date = today + timedelta(days=days_ahead)
        
        return Sessions.objects.filter(
            therapist=self.therapist,
            date=next_date,
            time=self.time_slot,
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

        ).exists()    