# chat/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('<int:session_id>/messages/', views.get_messages, name='get_messages'),
    path('<int:session_id>/send/', views.send_message, name='send_message'),
    path('my_sessions/',views.my_sessions,name='my_sessions'),
    path('<int:session_id>/check-access/', views.check_session_access, name='check_access'),
    path('<int:session_id>/notes/', views.get_notes),
    path('<int:session_id>/notes/save/', views.save_notes),
]
