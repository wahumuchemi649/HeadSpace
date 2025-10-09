from . import views
from django.urls import path

urlpatterns=[
    path('session/',views.session, name="session"),
    
]