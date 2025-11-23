from . import views
from django.urls import path

urlpatterns=[
    path('therapists/',views.Therapists_lists,name="therapy"),
    path('login/',views.login_view,name="login"),
    path('dashboard/',views.dashboard,name="dashboard"),
    path('therapist/sessions/',views.therapist_sessions,name="therapist_sessions")
    
]