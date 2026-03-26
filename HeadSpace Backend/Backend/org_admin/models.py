# org_admin/models.py

from django.db import models
from django.contrib.auth.models import User
from super_admin.models import Organization

class OrgAdmin(models.Model):
    """Organization Administrator Profile"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='org_admin_profile')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='admins')
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20)
    is_primary_admin = models.BooleanField(default=True)  # Can have multiple admins per org
    can_add_therapists = models.BooleanField(default=True)
    can_edit_org_settings = models.BooleanField(default=True)
    can_view_analytics = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.full_name} - {self.organization.name}"
    
    class Meta:
        db_table = 'org_admin'
        verbose_name = 'Organization Admin'
        verbose_name_plural = 'Organization Admins'

class OrgActivityLog(models.Model):
    """Track organization admin actions"""
    ACTION_TYPES = [
        ('therapist_added', 'Therapist Added'),
        ('therapist_edited', 'Therapist Edited'),
        ('therapist_deactivated', 'Therapist Deactivated'),
        ('settings_updated', 'Settings Updated'),
        ('code_changed', 'Organization Code Changed'),
        ('member_imported', 'Members Imported'),
    ]
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='activity_logs')
    admin = models.ForeignKey(OrgAdmin, on_delete=models.SET_NULL, null=True, related_name='actions')
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.organization.name} - {self.action_type} - {self.timestamp}"
    
    class Meta:
        db_table = 'org_activity_log'
        ordering = ['-timestamp']

class NotificationPreferences(models.Model):
    """Notification settings for org admins"""
    org_admin = models.OneToOneField(OrgAdmin, on_delete=models.CASCADE, related_name='notification_prefs')
    new_member = models.BooleanField(default=True)
    new_session = models.BooleanField(default=True)
    session_cancelled = models.BooleanField(default=True)
    weekly_report = models.BooleanField(default=False)
    monthly_report = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Notifications - {self.org_admin.full_name}"
    
    class Meta:
        db_table = 'org_notification_preferences'
# Create your models here.
