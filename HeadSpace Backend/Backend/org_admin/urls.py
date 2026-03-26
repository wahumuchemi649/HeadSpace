# org_admin/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('login/', views.org_admin_login, name='org_admin_login'),
    
    # Dashboard
    path('dashboard/', views.dashboard, name='org_dashboard'),
    path('analytics/', views.org_analytics, name='org_analytics'),
    path('recent-activity/', views.recent_activity, name='org_recent_activity'),
    
    # Therapist Management
    path('therapists/', views.list_therapists, name='list_therapists'),
    path('therapists/add/', views.add_therapist, name='add_therapist'),
    path('therapists/<int:therapist_id>/update/', views.update_therapist, name='update_therapist'),
    path('therapists/<int:therapist_id>/deactivate/', views.deactivate_therapist, name='deactivate_therapist'),
    path('settings/', views.get_organization_settings, name='get_organization_settings'),
    path('settings/update/', views.update_organization_settings, name='update_organization_settings'),
    # Member Management
    path('members/', views.list_members, name='list_members'),
    path('members/bulk-import/', views.bulk_import_members, name='bulk_import_members'),
    
    # Settings
    path('organization/update/', views.update_organization, name='update_organization'),
    path('update-code/', views.update_org_code, name='update_org_code'),
    path('profile/update/', views.update_admin_profile, name='update_admin_profile'),
    path('notifications/update/', views.update_notifications, name='update_notifications'),
    path('change-password/', views.change_password, name='change_password'),
]