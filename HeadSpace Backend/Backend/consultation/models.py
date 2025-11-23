from django.db import models
from django.contrib import admin
from therapy.models import therapists
from patients.models import patient


class Sessions(models.Model):
   day =models.CharField(max_length=100, default='xxxx')
   time= models.TimeField()
   therapist = models.ForeignKey(therapists, on_delete=models.CASCADE, null=True, related_name='sessions')
   patient = models.ForeignKey(patient, on_delete=models.CASCADE, null=True, related_name='sessions')   
   reason = models.TextField(default='xxxxxx')
   created_at = models.DateTimeField(auto_now_add=True)
   is_active = models.BooleanField(default=True)

  

@admin.register(Sessions)
class SessionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'day', 'time', 'therapist', 'reason', 'patient')

 #Create your models here.


    