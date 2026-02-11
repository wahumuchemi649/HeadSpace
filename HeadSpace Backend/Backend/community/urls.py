from django.urls import path
from . import views

urlpatterns = [
    path('communities/', views.list_communities, name='list_communities'),
    path('communities/check-similar/', views.check_similar_communities, name='check_similar'),
    path('communities/create/', views.create_community, name='create_community'),
    path('communities/<int:community_id>/', views.community_detail, name='community_detail'),
    path('communities/<int:community_id>/join/', views.join_community, name='join_community'),
    path('communities/<int:community_id>/leave/', views.leave_community, name='leave_community'),
    path('communities/<int:community_id>/posts/create/', views.create_post, name='create_post'),
]