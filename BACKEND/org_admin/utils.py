# org_admin/utils.py - COMPLETE FILE

from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def is_org_admin(user):
    """Check if user is an organization admin"""
    try:
        from org_admin.models import OrgAdmin
        return OrgAdmin.objects.filter(user=user).exists()
    except Exception as e:
        print(f"Error checking org admin: {e}")
        return False

def get_org_admin(user):
    """Get OrgAdmin profile for user"""
    try:
        from org_admin.models import OrgAdmin
        return OrgAdmin.objects.get(user=user)
    except Exception as e:
        print(f"Error getting org admin: {e}")
        return None

def log_activity(organization, admin, action_type, description):
    """Log organization admin activity"""
    try:
        from org_admin.models import OrgActivityLog
        
        OrgActivityLog.objects.create(
            organization=organization,
            admin=admin,
            action_type=action_type,
            description=description
        )
    except Exception as e:
        print(f"Error logging activity: {e}")