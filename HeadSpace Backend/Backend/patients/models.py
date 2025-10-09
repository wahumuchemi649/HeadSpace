from django.db import models
from django.contrib.auth.hashers import make_password

class patient(models.Model):
    firstName=models.CharField(max_length=255,default='xxxx')
    lastName=models.CharField(max_length=255,default='xxxx')
    phoneNumber=models.IntegerField(null=False)
    email=models.EmailField(max_length=255,default='xxxx@gmail.com')
    password =models.CharField(max_length=255, default=phoneNumber)

    def save(self,*args,**kwargs):

        if self.password and not self.password.startswith("pbkdf2_sha256$"):
            self.password=make_password(self.password)
        return super().save(*args,**kwargs)

    def __str__(self):
        return f"{self.email} {self.phoneNumber}"

# Create your models here.
