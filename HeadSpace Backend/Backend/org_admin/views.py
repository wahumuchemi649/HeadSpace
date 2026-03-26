from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import JsonResponse
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Q, Count
from datetime import timedelta
from .models import OrgAdmin, OrgActivityLog, NotificationPreferences
from .utils import get_tokens_for_user, is_org_admin, get_org_admin, log_activity
from super_admin.models import Organization
from therapy.models import therapists
from patients.models import patient
from consultation.models import Sessions
import logging
from django.core.mail import EmailMessage
from django.conf import settings


@api_view(['POST'])
@permission_classes([AllowAny])
def org_admin_login(request):
    """Organization admin login"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return JsonResponse({'error': 'Email and password required'}, status=400)
    
    # Authenticate user
    user = authenticate(username=email, password=password)
    
    if not user:
        return JsonResponse({'error': 'Invalid credentials'}, status=401)
    
    # Check if user is org admin
    if not is_org_admin(user):
        return JsonResponse({'error': 'Not authorized as organization admin'}, status=403)
    
    org_admin = get_org_admin(user)
    
    # Update last login
    org_admin.last_login = timezone.now()
    org_admin.save()
    
    # Generate tokens
    tokens = get_tokens_for_user(user)
    
    return JsonResponse({
        'message': 'Login successful',
        'access': tokens['access'],
        'refresh': tokens['refresh'],
        'organization': {
            'id': org_admin.organization.id,
            'name': org_admin.organization.name,
            'code': org_admin.organization.organization_code,
            'type': org_admin.organization.get_type_display()
        },
        'admin': {
            'id': org_admin.id,
            'full_name': org_admin.full_name,
            'email': user.email,
            'phone': org_admin.phone_number
        }
    })
# org_admin/views.py - UPDATE the dashboard function
# org_admin/views.py - dashboard function

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """Get organization dashboard data"""
    
    print("\n" + "="*60)
    print("DASHBOARD REQUEST")
    print("="*60)
    print(f"User: {request.user.username}")
    print(f"Authenticated: {request.user.is_authenticated}")
    
    try:
        # Check if org admin
        print("Checking if org admin...")
        
        from org_admin.models import OrgAdmin
        
        try:
            org_admin = OrgAdmin.objects.get(user=request.user)
            print(f"✅ Found org admin: {org_admin.full_name}")
        except OrgAdmin.DoesNotExist:
            print("❌ No OrgAdmin profile found")
            return JsonResponse({'error': 'Not authorized as organization admin'}, status=403)
        
        print("Getting organization...")
        organization = org_admin.organization
        
        if not organization:
            print("❌ No organization linked")
            return JsonResponse({'error': 'No organization linked to admin'}, status=500)
        
        print(f"✅ Got organization: {organization.name}")
        
        # Current month
        this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        print(f"Month start: {this_month_start}")
        
        # Import models
        from therapy.models import therapists
        from patients.models import patient
        from consultation.models import Sessions
        
        # Get stats
        print("Counting therapists...")
        therapists_count = therapists.objects.filter(organization=organization).count()
        print(f"✅ Therapists: {therapists_count}")
        
        print("Counting members...")
        members_count = patient.objects.filter(organization=organization).count()
        print(f"✅ Members: {members_count}")
        
        print("Counting sessions...")
        sessions_count = Sessions.objects.filter(
            therapist__organization=organization,
            day__gte=this_month_start.date()
        ).count()
        print(f"✅ Sessions: {sessions_count}")
        
        print("Counting new members...")
        # Check if patient has created_at field
        if hasattr(patient, 'created_at'):
            new_members = patient.objects.filter(
                organization=organization,
                created_at__gte=this_month_start
            ).count()
        else:
            new_members = 0
            print("⚠️ Patient model has no created_at field")
        print(f"✅ New members: {new_members}")
        
        print("Counting completed sessions...")
        # Check if Sessions has status field
        if hasattr(Sessions, 'status'):
            completed_sessions = Sessions.objects.filter(
                therapist__organization=organization,
                day__gte=this_month_start.date(),
                status='completed'
            ).count()
        else:
            completed_sessions = 0
            print("⚠️ Sessions model has no status field")
        print(f"✅ Completed sessions: {completed_sessions}")
        
        avg_rating = 0.0
        
        print("Preparing response...")
        response_data = {
            'stats': {
                'therapists': therapists_count,
                'members': members_count,
                'sessions': sessions_count,
                'new_members': new_members,
                'completed_sessions': completed_sessions,
                'avg_rating': round(avg_rating, 1)
            },
            'organization': {
                'id': organization.id,
                'name': organization.name,
                'code': organization.organization_code,
                'type': organization.get_type_display(),
                'contact_email': organization.contact_email or '',
                'contact_phone': organization.contact_phone or '',
                'max_members': organization.max_members or 0,
                'allow_self_registration': getattr(organization, 'allow_self_registration', True),
                'require_admin_approval': getattr(organization, 'require_admin_approval', False)
            }
        }
        
        print("✅ Success! Returning data")
        print("="*60 + "\n")
        return JsonResponse(response_data)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("="*60 + "\n")
        return JsonResponse({'error': str(e)}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_therapists(request):
    """Get all therapists for organization"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    organization = org_admin.organization
    
    # Get therapists
    org_therapists = therapists.objects.filter(organization=organization)
    
    therapists_data = []
    for therapist in org_therapists:
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


logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_therapist(request):
    """Add new therapist to organization and send welcome email"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    organization = org_admin.organization
    
    # Check permissions
    if not org_admin.can_add_therapists:
        return JsonResponse({'error': 'No permission to add therapists'}, status=403)
    
    # Get data
    data = request.data
    
    print("\n" + "="*60)
    print("ADD THERAPIST REQUEST")
    print("="*60)
    print(f"Organization: {organization.name}")
    print(f"Admin: {org_admin.full_name}")
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
        
        # Create therapist profile
        therapist = therapists.objects.create(
            user=user,
            organization=organization,
            firstName=data['firstName'],
            lastName=data['lastName'],
            phoneNumber=data['phoneNumber'],
            specialty_1=data['specialty_1'],
            specialty_2=data.get('specialty_2', ''),
            specialty_3=data.get('specialty_3', '')
        )
        print(f"✓ Created therapist profile")
        
        # ============================================
        # SEND WELCOME EMAIL TO THERAPIST
        # ============================================
        try:
            # Format specialties for display
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

Welcome to the HeadSpace platform! You have been added as a therapist for {organization.name}.

YOUR PROFILE INFORMATION:
-------------------------
Name: Dr. {data['firstName']} {data['lastName']}
Email: {data['email']}
Phone: {data['phoneNumber']}
Organization: {organization.name}

YOUR SPECIALTIES:
-----------------
{specialties_formatted}

HOW TO ACCESS THE PLATFORM:
---------------------------
📱 You login using your PHONE NUMBER (no password needed!)

Login Phone Number: {data['phoneNumber']}

1. Download the HeadSpace mobile app or visit our therapist portal
2. Enter your phone number: {data['phoneNumber']}


GETTING STARTED:
----------------
Once logged in, you can:
- View and manage your appointment schedule
- Access patient information and session notes
- Update your availability
- Review session history
- Manage your profile and specialties

IMPORTANT NOTES:
----------------
- Always login using your phone number: {data['phoneNumber']}
- You will receive an SMS with a verification code each time you login
- Keep your phone number up to date
- Contact your organization admin if you need to update your phone number

NEED HELP?
----------
If you have any questions or need assistance:
- Contact your organization admin: {organization.contact_email}
- Email our support team: chelsfavor@gmail.com 
- Phone: +254 117543225

We're excited to have you as part of our mental health care team!

Best regards,
The HeadSpace Team

On behalf of {organization.name}
Added by: {org_admin.full_name}

---
This is an automated email. Please do not reply directly to this message.
            """
            
            print("\nSending welcome email to therapist...")
            
            email_msg = EmailMessage(
                subject=f'🩺 Welcome to HeadSpace - You\'re Now a Therapist at {organization.name}',
                body=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[data['email']],
                reply_to=[organization.contact_email]  # Reply goes to organization
            )
            
            email_msg.send(fail_silently=False)
            
            print(f"✓ Welcome email sent to {data['email']}")
            
        except Exception as email_error:
            print(f"⚠️ Email sending failed: {email_error}")
            logger.error(f"Failed to send therapist welcome email: {email_error}", exc_info=True)
            # Don't fail the entire request if email fails
        
        # ============================================
        # LOG ACTIVITY
        # ============================================
        log_activity(
            organization=organization,
            admin=org_admin,
            action_type='therapist_added',
            description=f"Added therapist: {data['firstName']} {data['lastName']}"
        )
        
        print("✓ Activity logged")
        print("="*60 + "\n")
        
        return JsonResponse({
            'message': 'Therapist added successfully',
            'therapist_id': therapist.id,
            'email_sent': True
        })
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print("="*60 + "\n")
        
        logger.error(f"Error adding therapist: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_therapist(request, therapist_id):
    """Update therapist details"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    
    try:
        therapist = therapists.objects.get(
            id=therapist_id,
            organization=org_admin.organization
        )
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist not found'}, status=404)
    
    # Update fields
    data = request.data
    if 'firstName' in data:
        therapist.firstName = data['firstName']
    if 'lastName' in data:
        therapist.lastName = data['lastName']
    if 'phoneNumber' in data:
        therapist.phoneNumber = data['phoneNumber']
    if 'specialty_1' in data:
        therapist.specialty_1 = data['specialty_1']
    if 'specialty_2' in data:
        therapist.specialty_2 = data['specialty_2']
    if 'specialty_3' in data:
        therapist.specialty_3 = data['specialty_3']
    
    therapist.save()
    
    # Log activity
    log_activity(
        organization=org_admin.organization,
        admin=org_admin,
        action_type='therapist_edited',
        description=f"Updated therapist: {therapist.firstName} {therapist.lastName}"
    )
    
    return JsonResponse({'message': 'Therapist updated successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deactivate_therapist(request, therapist_id):
    """Deactivate therapist"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    
    try:
        therapist = therapists.objects.get(
            id=therapist_id,
            organization=org_admin.organization
        )
    except therapists.DoesNotExist:
        return JsonResponse({'error': 'Therapist not found'}, status=404)
    
    # Deactivate therapist (add is_active field if needed)
    if hasattr(therapist, 'is_active'):
        therapist.is_active = False
        therapist.save()
    
    # Deactivate user account
    if therapist.user:
        therapist.user.is_active = False
        therapist.user.save()
    
    # Log activity
    log_activity(
        organization=org_admin.organization,
        admin=org_admin,
        action_type='therapist_deactivated',
        description=f"Deactivated therapist: {therapist.firstName} {therapist.lastName}"
    )
    
    return JsonResponse({'message': 'Therapist deactivated successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_members(request):
    """Get all members for organization"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    organization = org_admin.organization
    
    # Get members
    members = patient.objects.filter(organization=organization)
    
    members_data = []
    for member in members:
        # Get session info
        sessions = Sessions.objects.filter(patient=member)
        sessions_count = sessions.count()
        last_session = sessions.order_by('-day').first()
        
        # Get therapist
        therapist_name = None
        if last_session and last_session.therapist:
            therapist_name = f"Dr. {last_session.therapist.firstName} {last_session.therapist.lastName}"
        
        members_data.append({
            'id': member.id,
            'firstName': member.firstName,
            'lastName': member.lastName,
            'email': member.user.email if member.user else '',
            'phone': member.phoneNumber,
            'joined_date': member.created_at.isoformat() if hasattr(member, 'created_at') else None,
            'status': 'active',  # Add status field to model later
            'sessions_count': sessions_count,
            'last_session': last_session.day.isoformat() if last_session else None,
            'therapist': therapist_name
        })
    
    return JsonResponse({'members': members_data})
# org_admin/views.py (continued)

# ============================================
# ORGANIZATION SETTINGS
# ============================================

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_organization(request):
    """Update organization settings"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    
    if not org_admin.can_edit_org_settings:
        return JsonResponse({'error': 'No permission to edit organization settings'}, status=403)
    
    organization = org_admin.organization
    data = request.data
    
    # Update fields
    if 'name' in data:
        organization.name = data['name']
    if 'type' in data:
        organization.type = data['type']
    if 'contact_email' in data:
        organization.contact_email = data['contact_email']
    if 'contact_phone' in data:
        organization.contact_phone = data['contact_phone']
    if 'max_members' in data:
        organization.max_members = int(data['max_members'])
    if 'allow_self_registration' in data:
        organization.allow_self_registration = data['allow_self_registration']
    if 'require_admin_approval' in data:
        organization.require_admin_approval = data['require_admin_approval']
    
    organization.save()
    
    # Log activity
    log_activity(
        organization=organization,
        admin=org_admin,
        action_type='settings_updated',
        description="Updated organization settings"
    )
    
    return JsonResponse({'message': 'Organization updated successfully'})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_org_code(request):
    """Update organization code"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    
    if not org_admin.can_edit_org_settings:
        return JsonResponse({'error': 'No permission to change organization code'}, status=403)
    
    organization = org_admin.organization
    new_code = request.data.get('code', '').strip().upper()
    
    if not new_code:
        return JsonResponse({'error': 'Code is required'}, status=400)
    
    # Validate code format (4-20 chars, alphanumeric and hyphens only)
    import re
    if not re.match(r'^[A-Z0-9-]{4,20}$', new_code):
        return JsonResponse({
            'error': 'Code must be 4-20 characters (letters, numbers, hyphens only)'
        }, status=400)
    
    # Check if code already exists
    if Organization.objects.filter(organization_code=new_code).exclude(id=organization.id).exists():
        return JsonResponse({'error': 'This code is already in use'}, status=400)
    
    old_code = organization.organization_code
    organization.organization_code = new_code
    organization.save()
    
    # Log activity
    log_activity(
        organization=organization,
        admin=org_admin,
        action_type='code_changed',
        description=f"Changed organization code from {old_code} to {new_code}"
    )
    
    return JsonResponse({
        'message': 'Organization code updated successfully',
        'code': new_code
    })

# ============================================
# ADMIN PROFILE
# ============================================

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_admin_profile(request):
    """Update organization admin profile"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    data = request.data
    
    # Update admin fields
    if 'full_name' in data:
        org_admin.full_name = data['full_name']
    if 'phone' in data:
        org_admin.phone_number = data['phone']
    
    org_admin.save()
    
    # Update user email
    if 'email' in data:
        org_admin.user.email = data['email']
        org_admin.user.username = data['email']
        org_admin.user.save()
    
    return JsonResponse({'message': 'Profile updated successfully'})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_notifications(request):
    """Update notification preferences"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    data = request.data
    
    # Get or create notification preferences
    prefs, created = NotificationPreferences.objects.get_or_create(org_admin=org_admin)
    
    # Update preferences
    if 'new_member' in data:
        prefs.new_member = data['new_member']
    if 'new_session' in data:
        prefs.new_session = data['new_session']
    if 'session_cancelled' in data:
        prefs.session_cancelled = data['session_cancelled']
    if 'weekly_report' in data:
        prefs.weekly_report = data['weekly_report']
    if 'monthly_report' in data:
        prefs.monthly_report = data['monthly_report']
    
    prefs.save()
    
    return JsonResponse({'message': 'Notification preferences updated successfully'})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change admin password"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return JsonResponse({'error': 'Current and new password required'}, status=400)
    
    # Check current password
    if not request.user.check_password(current_password):
        return JsonResponse({'error': 'Current password is incorrect'}, status=400)
    
    # Validate new password
    if len(new_password) < 8:
        return JsonResponse({'error': 'Password must be at least 8 characters'}, status=400)
    
    # Set new password
    request.user.set_password(new_password)
    request.user.save()
    
    return JsonResponse({'message': 'Password changed successfully'})

# ============================================
# ANALYTICS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def org_analytics(request):
    """Get organization analytics"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    
    if not org_admin.can_view_analytics:
        return JsonResponse({'error': 'No permission to view analytics'}, status=403)
    
    organization = org_admin.organization
    
    # Member growth over last 6 months
    member_growth = []
    for i in range(6):
        month_date = timezone.now() - timedelta(days=(5-i) * 30)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        count = patient.objects.filter(
            organization=organization,
            created_at__lte=month_start
        ).count()
        
        member_growth.append({
            'month': month_start.strftime('%b'),
            'count': count
        })
    
    # Sessions this month by therapist
    this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    therapist_sessions = []
    org_therapists = therapists.objects.filter(organization=organization)
    
    for therapist in org_therapists[:5]:  # Top 5
        sessions_count = Sessions.objects.filter(
            therapist=therapist,
            day__gte=this_month_start
        ).count()
        
        therapist_sessions.append({
            'name': f"{therapist.firstName} {therapist.lastName}",
            'sessions': sessions_count
        })
    
    return JsonResponse({
        'member_growth': member_growth,
        'therapist_sessions': therapist_sessions
    })

# ============================================
# BULK IMPORT
# ============================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_import_members(request):
    """Bulk import members from CSV"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    organization = org_admin.organization
    
    # Get CSV file
    csv_file = request.FILES.get('file')
    
    if not csv_file:
        return JsonResponse({'error': 'No file uploaded'}, status=400)
    
    if not csv_file.name.endswith('.csv'):
        return JsonResponse({'error': 'File must be CSV format'}, status=400)
    
    try:
        import csv
        import io
        
        # Read CSV
        decoded_file = csv_file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        
        imported_count = 0
        errors = []
        
        for row in reader:
            try:
                # Validate required fields
                if not all([row.get('First Name'), row.get('Last Name'), row.get('Email')]):
                    errors.append(f"Missing required fields for {row.get('Email', 'unknown')}")
                    continue
                
                email = row['Email'].strip()
                
                # Check if user already exists
                from django.contrib.auth.models import User
                if User.objects.filter(username=email).exists():
                    errors.append(f"User already exists: {email}")
                    continue
                
                # Create user
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password='TempPassword123!'  # Send password reset email
                )
                
                # Create patient
                patient.objects.create(
                    user=user,
                    organization=organization,
                    firstName=row['First Name'].strip(),
                    lastName=row['Last Name'].strip(),
                    phoneNumber=row.get('Phone', '').strip()
                )
                
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Error importing {row.get('Email', 'unknown')}: {str(e)}")
        
        # Log activity
        log_activity(
            organization=organization,
            admin=org_admin,
            action_type='member_imported',
            description=f"Bulk imported {imported_count} members"
        )
        
        return JsonResponse({
            'message': f'Successfully imported {imported_count} members',
            'imported': imported_count,
            'errors': errors
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ============================================
# ACTIVITY LOG
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activity(request):
    """Get recent organization activity"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    organization = org_admin.organization
    
    # Get recent activity
    activities = OrgActivityLog.objects.filter(
        organization=organization
    ).order_by('-timestamp')[:20]
    
    activity_data = []
    for activity in activities:
        # Calculate time ago
        time_diff = timezone.now() - activity.timestamp
        if time_diff.days > 0:
            time_ago = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
        elif time_diff.seconds >= 3600:
            hours = time_diff.seconds // 3600
            time_ago = f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif time_diff.seconds >= 60:
            minutes = time_diff.seconds // 60
            time_ago = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            time_ago = "Just now"
        
        activity_data.append({
            'action_type': activity.action_type,
            'description': activity.description,
            'admin': activity.admin.full_name if activity.admin else 'System',
            'time_ago': time_ago,
            'timestamp': activity.timestamp.isoformat()
        })
    
    return JsonResponse({'activities': activity_data})    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_organization_settings(request):
    """Get organization settings including public booking options"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    organization = org_admin.organization
    
    print(f"\n📋 Getting settings for: {organization.name}")
    
    return JsonResponse({
        'organization': {
            'id': organization.id,
            'name': organization.name,
            'code': organization.organization_code,
            'type': organization.type,
            'type_display': organization.get_type_display(),
            
            # Contact info
            'contact_email': organization.contact_email,
            'contact_phone': organization.contact_phone,
            
            # Member settings
            'max_members': organization.max_members,
            'allow_self_registration': organization.allow_self_registration,
            'require_admin_approval': organization.require_admin_approval,
            
            # Public booking settings
            'accept_public_patients': organization.accept_public_patients,
            'public_session_rate': float(organization.public_session_rate),
            
            # Subscription info
            'pricing_model': organization.pricing_model,
            'monthly_fee': float(organization.monthly_fee),
            'is_active': organization.is_active,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_organization_settings(request):
    """Update organization settings including public booking"""
    
    if not is_org_admin(request.user):
        return JsonResponse({'error': 'Not authorized'}, status=403)
    
    org_admin = get_org_admin(request.user)
    
    # Check if admin has permission to edit settings
    if not org_admin.can_edit_org_settings:
        return JsonResponse({'error': 'No permission to edit organization settings'}, status=403)
    
    organization = org_admin.organization
    data = request.data
    
    print("\n" + "="*60)
    print("UPDATE ORGANIZATION SETTINGS")
    print("="*60)
    print(f"Organization: {organization.name}")
    print(f"Admin: {org_admin.full_name}")
    print(f"Changes requested: {data}")
    
    try:
        # Update contact info
        if 'contact_email' in data:
            organization.contact_email = data['contact_email']
            print(f"✓ Updated contact_email: {data['contact_email']}")
        
        if 'contact_phone' in data:
            organization.contact_phone = data['contact_phone']
            print(f"✓ Updated contact_phone: {data['contact_phone']}")
        
        # Update member settings
        if 'allow_self_registration' in data:
            organization.allow_self_registration = data['allow_self_registration']
            print(f"✓ Updated allow_self_registration: {data['allow_self_registration']}")
        
        if 'require_admin_approval' in data:
            organization.require_admin_approval = data['require_admin_approval']
            print(f"✓ Updated require_admin_approval: {data['require_admin_approval']}")
        
        # Update public booking settings
        if 'accept_public_patients' in data:
            old_value = organization.accept_public_patients
            new_value = data['accept_public_patients']
            organization.accept_public_patients = new_value
            
            print(f"✓ Updated accept_public_patients: {old_value} → {new_value}")
            
            # Log activity
            status_text = "enabled" if new_value else "disabled"
            log_activity(
                organization=organization,
                admin=org_admin,
                action_type='settings_updated',
                description=f"Public patient booking {status_text}"
            )
        
        if 'public_session_rate' in data:
            old_rate = organization.public_session_rate
            new_rate = data['public_session_rate']
            organization.public_session_rate = new_rate
            
            print(f"✓ Updated public_session_rate: KES {old_rate} → KES {new_rate}")
            
            # Log activity
            log_activity(
                organization=organization,
                admin=org_admin,
                action_type='settings_updated',
                description=f"Updated public session rate to KES {new_rate}"
            )
        
        # Save changes
        organization.save()
        
        print("✅ Settings updated successfully")
        print("="*60 + "\n")
        
        return JsonResponse({
            'message': 'Settings updated successfully',
            'organization': {
                'name': organization.name,
                'accept_public_patients': organization.accept_public_patients,
                'public_session_rate': float(organization.public_session_rate)
            }
        })
        
    except Exception as e:
        print(f"❌ Error updating settings: {e}")
        import traceback
        traceback.print_exc()
        print("="*60 + "\n")
        
        return JsonResponse({'error': str(e)}, status=500)

