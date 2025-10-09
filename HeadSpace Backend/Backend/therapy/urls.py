from . import views
from django.urls import path

urlpatterns=[
    path('therapists/',views.Therapists_lists,name="therapy")
    
]