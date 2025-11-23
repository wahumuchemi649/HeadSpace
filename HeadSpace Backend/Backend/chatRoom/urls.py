
from django.urls import path
from .views import MessageListCreateView,UserSessionsView

urlpatterns=[
   # path('Messages/',MyInbox.as_view(),name='MyInbox'),
    path('messages/<int:session_id>/',MessageListCreateView.as_view(),name='recents'),
    path('sessions/', UserSessionsView.as_view(), name='user-sessions')
]
    