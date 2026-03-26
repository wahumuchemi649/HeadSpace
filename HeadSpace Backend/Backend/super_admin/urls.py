# super_admin/urls.py

from django.urls import path
from . import views

urlpatterns = [
  
    path('login/', views.super_admin_login, name='super_admin_login'),
    path('dashboard-stats/', views.dashboard_stats, name='dashboard_stats'),
    path('recent-activity/', views.recent_activity, name='recent_activity'),
    path('organizations/', views.list_organizations, name='list_organizations'),
    path('organizations/create/', views.create_organization, name='create_organization'),
    path('organizations/<int:org_id>/deactivate/', views.deactivate_organization, name='deactivate_organization'),
    path('therapists/', views.list_independent_therapists, name='list_independent_therapists'),
    path('therapists/add/', views.add_independent_therapist, name='add_independent_therapist'),
    path('therapists/<int:therapist_id>/deactivate/', views.deactivate_independent_therapist, name='deactivate_independent_therapist'),
    path('therapists/<int:therapist_id>/activate/', views.activate_independent_therapist, name='activate_independent_therapist'),
    path('analytics/', views.platform_analytics, name='platform_analytics'),
    
  
]