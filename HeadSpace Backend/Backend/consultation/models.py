from django.db import models
from therapy.models import therapists

class Sessions(models.Model):
   time= models.TimeField()
   therapist = models.ForeignKey(therapists, on_delete=models.CASCADE, default=123)
   reason = models.TextField(default='xxxxxx')
  

# Create your models here.
