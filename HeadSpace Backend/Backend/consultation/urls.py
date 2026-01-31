from . import views
from django.urls import path

urlpatterns=[
    path('session/',views.session, name="session"),
    path('upcoming-sessions/', views.upcoming_sessions, name='upcoming_sessions'), 
    path('todays-sessions/', views.todays_sessions, name='todays_sessions'), 
]