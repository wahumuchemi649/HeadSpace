from django.db import models
from django.contrib import admin
from therapy.models import therapists


class Sessions(models.Model):
   day =models.CharField(max_length=100, default='xxxx')
   time= models.TimeField()
   therapist = models.ForeignKey(therapists, on_delete=models.CASCADE, null=True)
   reason = models.TextField(default='xxxxxx')
  

@admin.register(Sessions)
class SessionsAdmin(admin.ModelAdmin):
    list_display = ('id', 'day', 'time', 'therapist', 'reason')

# Create your models here.
