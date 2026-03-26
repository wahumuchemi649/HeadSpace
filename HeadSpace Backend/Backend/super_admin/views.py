from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Q
from datetime import datetime, timedelta
from django.utils import timezone
from .models import SuperAdmin, Organization, ActivityLog, EmailLog
from patients.models import patient
from therapy.models import therapists
from consultation.models import Sessions
import random
import string


@api_view(['POST'])
@permission_classes([AllowAny])
def super_admin_login(request):
    """Super admin login"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return JsonResponse({'error': 'Email and password required'}, status=400)
    # Authenticate
    user = authenticate(username=email, password=password)
    
    if not user:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)
    try:
        super_admin = SuperAdmin.objects.get(user=user)
    except SuperAdmin.DoesNotExist:
        return JsonResponse({'error': 'Not authorized as super admin'}, status=403)
    
    # Update last login
    super_admin.last_login = timezone.now()
    super_admin.save()
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return JsonResponse({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'email': user.email,
            'full_name': super_admin.full_name,
            'is_super_admin': True
        }
    })


def is_super_admin(user):
    """Check if user is super admin"""
    try:
        return SuperAdmin.objects.filter(user=user).exists()
    except:
        return False

class IsSuperAdmin:
    """Custom permission class"""
    def has_permission(self, request, view):
        return request.user and is_super_admin(request.user)


# ============================================
# DASHBOARD STATS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard overview statistics - REAL DATA ONLY"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    # Current month
    now = timezone.now()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # ============================================
    # REAL COUNTS
    # ============================================
    total_organizations = Organization.objects.count()
    active_organizations = Organization.objects.filter(is_active=True).count()
    total_therapists = therapists.objects.count()
    total_patients = patient.objects.count()
    
    # This month sessions
    sessions_this_month = Sessions.objects.filter(
        day__gte=this_month_start.date()
    ).count()
   
    subscription_orgs = Organization.objects.filter(
        pricing_model='subscription',
        is_active=True
    )
    
    revenue_this_month = sum([
        float(org.monthly_fee) for org in subscription_orgs if org.monthly_fee
    ])
    
   
    if total_organizations > 0:
        active_percentage = int((active_organizations / total_organizations) * 100)
    else:
        active_percentage = 0
    
    stats = {
        'organizations': total_organizations,
        'therapists': total_therapists,
        'patients': total_patients,
        'sessions': sessions_this_month,
        'revenue': revenue_this_month,
        'active': active_percentage
    }
    
    return JsonResponse(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activity(request):
    """Get recent activity feed"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    activities = ActivityLog.objects.all()[:10]
    
    activity_list = [{
        'text': activity.description,
        'time': get_time_ago(activity.timestamp)
    } for activity in activities]
    
    return JsonResponse(activity_list, safe=False)


def get_time_ago(timestamp):
    """Convert timestamp to 'X hours ago' format"""
    now = timezone.now()
    diff = now - timestamp
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds >= 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds >= 60:
        minutes = diff.seconds // 60
        return f"{minutes} min ago"
    else:
        return "just now"


# ============================================
# ORGANIZATIONS MANAGEMENT
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_organizations(request):
    """List all organizations"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    organizations = Organization.objects.all()
    
    org_list = []
    for org in organizations:
        # Count members and therapists
        member_count = patient.objects.filter(organization=org).count()
        therapist_count = therapists.objects.filter(organization=org).count()
        
        org_list.append({
            'id': org.id,
            'name': org.name,
            'type': org.type,
            'type_display': org.get_type_display(),
            'organization_code': org.organization_code,
            'contact_email': org.contact_email,
            'pricing_model': org.pricing_model,
            'monthly_fee': float(org.monthly_fee) if org.monthly_fee else 0,
            'member_count': member_count,
            'therapist_count': therapist_count,
            'is_active': org.is_active,
            'created_date': org.created_at.strftime('%b %Y'),
            'created_at': org.created_at.isoformat()
        })
    
    return JsonResponse(org_list, safe=False)


def generate_org_code(org_name):
    """Generate organization code from name"""
    # Get initials
    words = org_name.upper().split()
    initials = ''.join([word[0] for word in words if len(word) > 2])[:4]
    
    # Add year
    year = datetime.now().year
    
    # Combine
    code = f"{initials}{year}"
    
    # Check if exists, add random suffix if needed
    counter = 1
    original_code = code
    while Organization.objects.filter(organization_code=code).exists():
        code = f"{original_code}{counter}"
        counter += 1
    
    return code
# super_admin/views.py

# super_admin/views.py

from django.core.mail import EmailMessage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_organization(request):
    """Create a new organization and send welcome email to admin"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    data = request.data
    print("\n" + "="*60)
    print("CREATE ORGANIZATION REQUEST")
    print("="*60)
    print("Received data:", data)
    
    # Validate required fields
    required_fields = ['name', 'type', 'admin_name', 'admin_email', 'contact_phone']
    for field in required_fields:
        if not data.get(field):
            return JsonResponse({'error': f'{field} is required'}, status=400)
    
    # Check if admin email already exists
    if User.objects.filter(username=data['admin_email']).exists():
        return JsonResponse({'error': 'Admin email already exists'}, status=400)
    
    try:
        # Generate organization code
        org_code = data.get('organization_code') or generate_org_code(data['name'])
        temp_password = 'TempPassword123!'
        
        print(f"Creating organization: {data['name']}")
        print(f"Organization code: {org_code}")
        
        # Create admin user account
        admin_user = User.objects.create_user(
            username=data['admin_email'],
            email=data['admin_email'],
            password=temp_password
        )
        print(f"✓ Created user: {admin_user.email}")
        
        # Create organization
        organization = Organization.objects.create(
            name=data['name'],
            type=data['type'],
            organization_code=org_code,
            admin_user=admin_user,
            admin_name=data['admin_name'],
            contact_email=data.get('contact_email', data['admin_email']),
            contact_phone=data['contact_phone'],
            pricing_model=data.get('pricing_model', 'subscription'),
            monthly_fee=data.get('monthly_fee', 0),
            max_members=data.get('max_members', 0),
            is_active=True,
            allow_self_registration=data.get('allow_self_registration', True),
            require_admin_approval=data.get('require_admin_approval', False)
        )
        print(f"✓ Created organization: {organization.name}")
        
        # ============================================
        # CREATE ORG ADMIN PROFILE
        # ============================================
        from org_admin.models import OrgAdmin, NotificationPreferences
        
        org_admin = OrgAdmin.objects.create(
            user=admin_user,
            organization=organization,
            full_name=data['admin_name'],
            phone_number=data.get('admin_phone', data['contact_phone']),
            is_primary_admin=True,
            can_add_therapists=True,
            can_edit_org_settings=True,
            can_view_analytics=True,
        )
        print(f"✓ Created OrgAdmin profile")
        
        # Create default notification preferences
        NotificationPreferences.objects.create(
            org_admin=org_admin,
            new_member=True,
            new_session=True,
            session_cancelled=True,
            weekly_report=False,
            monthly_report=True
        )
        print(f"✓ Created notification preferences")
        
        # ============================================
        # SEND WELCOME EMAIL
        # ============================================
        try:
            email_body = f"""
Welcome to HeadSpace!
=====================

Dear {data['admin_name']},

Congratulations! Your organization has been successfully added to the HeadSpace platform.

ORGANIZATION DETAILS:
---------------------
Organization Name: {organization.name}
Organization Code: {org_code}
Organization Type: {organization.get_type_display()}

YOUR ADMIN CREDENTIALS:
-----------------------
Username (Email): {data['admin_email']}
Temporary Password: {temp_password}

🔒 IMPORTANT SECURITY NOTICE:
For your security, please change your password immediately after your first login.

HOW TO GET STARTED:
-------------------
1. Visit: https://headspace.app/org-admin/login
   (or your HeadSpace organization admin portal)

2. Login with the credentials above

3. Go to Settings → Security → Change Password

4. Update your password to something secure and memorable

5. Start adding therapists and managing your organization!

WHAT'S NEXT?
------------
- Add therapists to your organization
- Share the organization code ({org_code}) with your members
- Customize your organization settings
- Set up notification preferences

NEED HELP?
----------
If you have any questions or need assistance, please don't hesitate to contact us:
- Email: chelsfavor@gmail.com
- Phone: +254 117543225

We're excited to have you on board!

Best regards,
The HeadSpace Team

---
This is an automated email. Please do not reply directly to this message.
            """
            
            print("\nSending welcome email...")
            
            email_msg = EmailMessage(
                subject=f'🎉 Welcome to HeadSpace - {organization.name}',
                body=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[data['admin_email']],
                reply_to=['support@headspace.app']  # Your support email
            )
            
            email_msg.send(fail_silently=False)
            
            print(f"✓ Welcome email sent to {data['admin_email']}")
            
            # Log email in database
            EmailLog.objects.create(
                email_type='Welcome',
                recipient=data['admin_email'],
                organization=organization,
                status='sent'
            )
            
        except Exception as email_error:
            print(f"⚠️ Email sending failed: {email_error}")
            logger.error(f"Failed to send welcome email: {email_error}", exc_info=True)
            
            # Log failed email
            EmailLog.objects.create(
                email_type='Welcome',
                recipient=data['admin_email'],
                organization=organization,
                status='failed'
            )
            
            # Don't fail the entire request if email fails
            # The organization is already created successfully
        
        # ============================================
        # LOG ACTIVITY
        # ============================================
        ActivityLog.objects.create(
            action_type='organization_created',
            description=f"Created organization: {organization.name}",
            user=request.user,
            organization=organization
        )
        
        print("✓ Activity logged")
        print("="*60 + "\n")
        
        return JsonResponse({
            'message': 'Organization created successfully',
            'organization_id': organization.id,
            'organization_code': org_code,
            'admin_email': data['admin_email'],
            'temp_password': temp_password,
            'email_sent': True  # Indicate email was attempted
        })
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("="*60 + "\n")
        
        logger.error(f"Error creating organization: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deactivate_organization(request, org_id):
    """Deactivate organization"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    try:
        organization = Organization.objects.get(id=org_id)
        organization.is_active = False
        organization.save()
        
        # Log activity
        ActivityLog.objects.create(
            action_type='org_deactivated',
            description=f'Deactivated: {organization.name}',
            user=request.user,
            organization=organization
        )
        
        return JsonResponse({'success': True})
        
    except Organization.DoesNotExist:
        return JsonResponse({'error': 'Organization not found'}, status=404)


# ============================================
# ANALYTICS
# ============================================


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def platform_analytics(request):
    """Get platform analytics data - REAL DATA ONLY"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    time_range = request.GET.get('range', '7months')
    
    # ============================================
    # USER GROWTH DATA (Real data)
    # ============================================
    user_growth = []
    for i in range(7):
        month_date = timezone.now() - timedelta(days=(6-i) * 30)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        # Count users created IN this specific month
        patients_count = patient.objects.filter(
            created_at__gte=month_start,
            created_at__lte=month_end
        ).count()
        
        therapists_count = therapists.objects.filter(
            created_at__gte=month_start,
            created_at__lte=month_end
        ).count()
        
        user_growth.append({
            'month': month_start.strftime('%b'),
            'patients': patients_count,
            'therapists': therapists_count
        })
    
    # ============================================
    # SESSION STATISTICS (Real data - This Week)
    # ============================================
    session_stats = []
    for i in range(7):
        day = timezone.now() - timedelta(days=6-i)
        sessions_count = Sessions.objects.filter(day=day.date()).count()
        
        session_stats.append({
            'day': day.strftime('%a'),
            'sessions': sessions_count
        })
    
    # ============================================
    # THERAPIST UTILIZATION (Real data)
    # ============================================
    all_therapists = therapists.objects.select_related('organization').all()
    therapist_utilization = []
    
    # Get current month
    current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    for therapist in all_therapists[:10]:  # Top 10 therapists
        # Organization name
        org_name = therapist.organization.name if therapist.organization else 'Independent'
        
        # Specialty
        specialty = getattr(therapist, 'specialty_1', 'General') or 'General'
        
        # Count sessions this month
        sessions_count = Sessions.objects.filter(
            therapist=therapist,
            day__gte=current_month_start.date()
        ).count()
        
        # Calculate utilization (assuming 50 sessions per month = 100%)
        utilization = min(int((sessions_count / 50) * 100), 100)
        
        therapist_utilization.append({
            'name': f"Dr. {therapist.firstName} {therapist.lastName}",
            'organization': f"{org_name} • {specialty}",
            'sessions': sessions_count,
            'utilization': utilization
        })
    
    # Sort by utilization (highest first)
    therapist_utilization.sort(key=lambda x: x['utilization'], reverse=True)
    
    # ============================================
    # EMAIL ACTIVITY (Real data)
    # ============================================
    recent_emails = EmailLog.objects.select_related('organization').order_by('-sent_at')[:10]
    
    email_activity = []
    for email in recent_emails:
        email_activity.append({
            'type': email.email_type,
            'recipient': email.recipient,
            'organization': email.organization.name if email.organization else 'N/A',
            'time': get_time_ago(email.sent_at),
            'status': email.get_status_display()
        })
    
    return JsonResponse({
        'userGrowth': user_growth,
        'sessionStats': session_stats,
        'therapistUtilization': therapist_utilization,
        'emailActivity': email_activity
    })
# super_admin/views.py

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_independent_therapists(request):
    """List all independent therapists (not affiliated with any organization)"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    # Get therapists with no organization
    independent_therapists = therapists.objects.filter(organization__isnull=True)
    
    therapists_data = []
    for therapist in independent_therapists:
        # Count sessions
        sessions_count = Sessions.objects.filter(therapist=therapist).count()
        
        therapists_data.append({
            'id': therapist.id,
            'firstName': therapist.firstName,
            'lastName': therapist.lastName,
            'email': therapist.user.email if therapist.user else '',
            'phoneNumber': therapist.phoneNumber,
            'specialty_1': therapist.specialty_1 or '',
            'specialty_2': therapist.specialty_2 or '',
            'specialty_3': therapist.specialty_3 or '',
            'is_active': therapist.is_active if hasattr(therapist, 'is_active') else True,
            'sessions_count': sessions_count,
            'rating': 4.5,  # Mock rating
            'joined_date': therapist.created_at.strftime('%b %Y') if hasattr(therapist, 'created_at') else 'N/A'
        })
    
    return JsonResponse({'therapists': therapists_data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_independent_therapist(request):
    """Add new independent therapist (not affiliated with any organization)"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    data = request.data
    
    print("\n" + "="*60)
    print("ADD INDEPENDENT THERAPIST REQUEST")
    print("="*60)
    print(f"Super Admin: {request.user.username}")
    print(f"Therapist: {data.get('firstName')} {data.get('lastName')}")
    
    # Validate required fields
    required_fields = ['firstName', 'lastName', 'email', 'phoneNumber', 'specialty_1']
    for field in required_fields:
        if not data.get(field):
            return JsonResponse({'error': f'{field} is required'}, status=400)
    
    # Check if email already exists
    from django.contrib.auth.models import User
    if User.objects.filter(username=data['email']).exists():
        return JsonResponse({'error': 'Email already registered'}, status=400)
    
    try:
        # Create user account
        user = User.objects.create_user(
            username=data['email'],
            email=data['email'],
            password='TempPassword123!'  # Not used for therapist login
        )
        print(f"✓ Created user: {user.email}")
        
        # Create therapist profile (NO ORGANIZATION)
        therapist = therapists.objects.create(
            user=user,
            organization=None,  # Independent therapist
            firstName=data['firstName'],
            lastName=data['lastName'],
            phoneNumber=data['phoneNumber'],
            specialty_1=data['specialty_1'],
            specialty_2=data.get('specialty_2', ''),
            specialty_3=data.get('specialty_3', '')
        )
        print(f"✓ Created independent therapist profile")
        
        # ============================================
        # SEND WELCOME EMAIL TO THERAPIST
        # ============================================
        try:
            specialties_list = [data['specialty_1']]
            if data.get('specialty_2'):
                specialties_list.append(data['specialty_2'])
            if data.get('specialty_3'):
                specialties_list.append(data['specialty_3'])
            
            specialties_formatted = '\n'.join([f"  • {s}" for s in specialties_list])
            
            email_body = f"""
Welcome to HeadSpace, Dr. {data['lastName']}!
=============================================

Dear Dr. {data['firstName']} {data['lastName']},

Welcome to the HeadSpace platform! You have been added as an independent therapist by our platform administrator.

YOUR PROFILE INFORMATION:
-------------------------
Name: Dr. {data['firstName']} {data['lastName']}
Email: {data['email']}
Phone: {data['phoneNumber']}
Status: Independent Therapist (Not affiliated with any organization)

YOUR SPECIALTIES:
-----------------
{specialties_formatted}

HOW TO ACCESS THE PLATFORM:
---------------------------
📱 You login using your PHONE NUMBER (no password needed!)

Login Phone Number: {data['phoneNumber']}

1. Download the HeadSpace mobile app or visit our therapist portal
2. Enter your phone number: {data['phoneNumber']}


AS AN INDEPENDENT THERAPIST:
----------------------------
- You can accept patients directly through the platform
- Set your own price  rates and availability
- Manage your schedule independently
- Access all platform features and tools

GETTING STARTED:
----------------
Once logged in, you can:
- Set up your profile and availability
- Define your session rates
- Start accepting patient bookings
- Manage your appointment schedule
- Access session notes and patient information

IMPORTANT NOTES:
----------------
- Always login using your phone number: {data['phoneNumber']}
- You will receive an SMS with a verification code each time you login
- Keep your phone number up to date
- Contact support if you need to update your phone number

NEED HELP?
----------
If you have any questions or need assistance:
- Email: chelsfavor@gmail.com
- Phone: +254 117543225

We're excited to have you as part of our mental health care team!

Best regards,
The HeadSpace Team

---
This is an automated email. Please do not reply directly to this message.
            """
            
            print("\nSending welcome email to independent therapist...")
            
            email_msg = EmailMessage(
                subject=f'🩺 Welcome to HeadSpace - Independent Therapist Account Created',
                body=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[data['email']],
                reply_to=['chelsfavor@gmail.com']
            )
            
            email_msg.send(fail_silently=False)
            
            print(f"✓ Welcome email sent to {data['email']}")
            
        except Exception as email_error:
            print(f"⚠️ Email sending failed: {email_error}")
            logger.error(f"Failed to send therapist welcome email: {email_error}", exc_info=True)
        
        # ============================================
        # LOG ACTIVITY
        # ============================================
        ActivityLog.objects.create(
            action_type='independent_therapist_added',
            description=f"Added independent therapist: {data['firstName']} {data['lastName']}",
            user=request.user,
            organization=None
        )
        
        print("✓ Activity logged")
        print("="*60 + "\n")
        
        return JsonResponse({
            'message': 'Independent therapist added successfully',
            'therapist_id': therapist.id,
            'email_sent': True
        })
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("="*60 + "\n")
        
        logger.error(f"Error adding independent therapist: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deactivate_independent_therapist(request, therapist_id):
    """Deactivate independent therapist"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    try:
        therapist = therapists.objects.get(id=therapist_id, organization__isnull=True)
        
        # Deactivate therapist
        if hasattr(therapist, 'is_active'):
            therapist.is_active = False
            therapist.save()
        
        # Deactivate user account
        if therapist.user:
            therapist.user.is_active = False
            therapist.user.save()
        
        # Log activity
        ActivityLog.objects.create(
            action_type='independent_therapist_deactivated',
            description=f"Deactivated independent therapist: {therapist.firstName} {therapist.lastName}",
            user=request.user,
            organization=None
        )
        
        return JsonResponse({'message': 'Therapist deactivated successfully'})
        
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_independent_therapist(request, therapist_id):
    """Activate independent therapist"""
    
    if not is_super_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    try:
        therapist = therapists.objects.get(id=therapist_id, organization__isnull=True)
        
        # Activate therapist
        if hasattr(therapist, 'is_active'):
            therapist.is_active = True
            therapist.save()
        
        # Activate user account
        if therapist.user:
            therapist.user.is_active = True
            therapist.user.save()
        
        # Log activity
        ActivityLog.objects.create(
            action_type='independent_therapist_activated',
            description=f"Activated independent therapist: {therapist.firstName} {therapist.lastName}",
            user=request.user,
            organization=None
        )
        
        return JsonResponse({'message': 'Therapist activated successfully'})
        
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist not found'}, status=404)