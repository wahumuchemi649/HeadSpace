from . import views
from django.urls import path

urlpatterns=[
    path("patient/",views.register_patient,name='patient'),
    path('list_patients/',views.list_patients,name='list_patients'),
    path('login/',views.login,name='login_patients')
]