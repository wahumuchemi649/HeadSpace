from . import views
from django.urls import path

urlpatterns=[
    path('therapists/',views.Therapists_lists,name="therapy"),
    path('login/',views.login_view,name="login"),
    path('dashboard/',views.dashboard,name="dashboard"),
    path('therapist/sessions/',views.therapist_sessions,name="therapist_sessions"),
    path('therapist/availability/', views.get_availability_grid, name='therapist_availability'),
    path('therapist/availability/toggle/', views.toggle_availability, name='toggle_availability'),
    path('therapist/<int:therapist_id>/availability/', views.get_therapist_availability_for_patient, name='patient_view_availability'),
    path('therapist-apply/', views.therapist_apply, name='therapist_apply'),
]