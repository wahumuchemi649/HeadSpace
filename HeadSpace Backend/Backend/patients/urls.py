from . import views
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns=[
    path("patient/",views.register_patient,name='patient'),
    path('list_patients/',views.list_patients,name='list_patients'),
    path('login/',views.login,name='login_patients'),
    path('patientDashboard/',views.patientDashboard, name='patientDashboard'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]