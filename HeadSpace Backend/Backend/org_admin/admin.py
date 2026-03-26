from django.contrib import admin
from .models import OrgAdmin, OrgActivityLog, NotificationPreferences

@admin.register(OrgAdmin)
class OrgAdminAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'organization', 'user', 'is_primary_admin', 'created_at']
    list_filter = ['organization', 'is_primary_admin', 'created_at']
    search_fields = ['full_name', 'user__email', 'organization__name']

@admin.register(OrgActivityLog)
class OrgActivityLogAdmin(admin.ModelAdmin):
    list_display = ['organization', 'action_type', 'admin', 'timestamp']
    list_filter = ['action_type', 'organization', 'timestamp']
    search_fields = ['description', 'organization__name']

@admin.register(NotificationPreferences)
class NotificationPreferencesAdmin(admin.ModelAdmin):
    list_display = ['org_admin', 'new_member', 'new_session', 'weekly_report', 'monthly_report']
# Register your models here.
