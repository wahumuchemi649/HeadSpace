from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from .models import therapists

def Therapists_lists(request):
   Therapists=therapists.objects.all().values("id","firstName","lastName","profile_pic","description")
   return JsonResponse(list(Therapists),safe= False)

# Create your views here.
