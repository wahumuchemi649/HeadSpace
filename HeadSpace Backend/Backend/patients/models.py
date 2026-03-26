from django.db import models
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from super_admin.models import Organization

class patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    firstName=models.CharField(max_length=255,default='xxxx')
    lastName=models.CharField(max_length=255,default='xxxx')
    phoneNumber=models.IntegerField(null=False)
    organization = models.ForeignKey(Organization,null=True,blank=True,on_delete=models.SET_NULL,related_name='members'
    )

    def __str__(self):
        return f"{self.firstName} {self.lastName} - {self.phoneNumber}"

# Create your models here.
