from django.db import models

# Create your models here.
class therapists(models.Model):
    firstName = models.CharField(max_length=255,default='xxxx')
    lastName=models.CharField(max_length=255, default='xxxx')
    phoneNumber=models.IntegerField(null=True)
    email=models.EmailField(max_length=255,default='xxxx@gmai.com')
    description=models.CharField(max_length=400,default="A certified Therapist")
    profile_pic=models.ImageField(upload_to="therapists/")

    def __str__(self):
        return f"{self.firstName}     {self.lastName}       {self.description}"

class patients(models.Model):
    firstName=models.CharField(max_length=255,default='xxxx')
    lastName=models.CharField(max_length=255,default='xxxx')
    phoneNumber=models.IntegerField(null=False)
    email=models.EmailField(max_length=255,default='xxxx@gmail.com')

    def __str__(self):
        return f"{self.email} {self.phoneNumber}"