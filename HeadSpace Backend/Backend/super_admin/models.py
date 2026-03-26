
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class SuperAdmin(models.Model):
    """Platform owner/super admin"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='super_admin_profile')
    full_name = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=20, blank=True)
    
    # Permissions
    can_create_organizations = models.BooleanField(default=True)
    can_delete_organizations = models.BooleanField(default=True)
    can_view_all_data = models.BooleanField(default=True)
    can_modify_system_settings = models.BooleanField(default=True)
    
    # Activity tracking
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Super Admin: {self.full_name}"
    
    class Meta:
        verbose_name = "Super Admin"
        verbose_name_plural = "Super Admins"


class Organization(models.Model):
    """Organization (University, Company, NGO, etc.)"""
    
    TYPE_CHOICES = [
        ('university', 'University'),
        ('company', 'Company'),
        ('ngo_free', 'Non-Profit (Free Services)'),
        ('ngo_subsidized', 'Non-Profit (Subsidized)'),
        ('government', 'Government Agency'),
    ]
    
    PRICING_MODEL_CHOICES = [
        ('subscription', 'Monthly Subscription'),
        ('free', 'Free (Community Partner)'),
    ]
    
    # Basic Info
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    
    # Organization Code (CRITICAL!)
    organization_code = models.CharField(
        max_length=20, 
        unique=True,
        help_text="Code members use to join (e.g., UON2024)"
    )
    accept_public_patients = models.BooleanField(
        default=False,
        help_text="Allow non-members to book sessions with org therapists for a fee"
    )
    public_session_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=4000.00,
        help_text="Rate for non-members booking org therapists (KES)"
    )
    # Admin User
    admin_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='managed_organization'
    )
    admin_name = models.CharField(max_length=200)
    
    # Contact Information
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    
    # Subscription Details
    pricing_model = models.CharField(max_length=50, choices=PRICING_MODEL_CHOICES)
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_members = models.IntegerField(default=100)
    
    # Status
    is_active = models.BooleanField(default=True)
    subscription_start = models.DateField(auto_now_add=True)
    subscription_end = models.DateField(null=True, blank=True)
    
    # Settings
    allow_self_registration = models.BooleanField(default=True)
    require_admin_approval = models.BooleanField(default=False)
    
    # Logo/Branding
    logo = models.ImageField(upload_to='org_logos/', blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # SSO
    sso_enabled = models.BooleanField(default=False)
    sso_provider = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.organization_code})"
    
    class Meta:
        ordering = ['-created_at']


class ActivityLog(models.Model):
    """Track all important platform activities"""
    
    ACTION_TYPES = [
        ('org_created', 'Organization Created'),
        ('org_updated', 'Organization Updated'),
        ('org_deactivated', 'Organization Deactivated'),
        ('therapist_added', 'Therapist Added'),
        ('patient_registered', 'Patient Registered'),
        ('session_completed', 'Session Completed'),
        ('payment_processed', 'Payment Processed'),
    ]
    
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action_type} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class EmailLog(models.Model):
    """Track all emails sent from platform"""
    
    STATUS_CHOICES = [
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
    ]
    
    email_type = models.CharField(max_length=100)  # Welcome, Reminder, etc.
    recipient = models.EmailField()
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"{self.email_type} to {self.recipient} - {self.status}"
# Create your models here.
