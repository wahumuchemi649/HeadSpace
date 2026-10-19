
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from org_admin.models import OrgAdmin, NotificationPreferences
from super_admin.models import Organization

class Command(BaseCommand):
    help = 'Create an organization admin user'

    def handle(self, *args, **kwargs):
        self.stdout.write('\n=== Create Organization Admin ===\n')
        
        # List organizations
        orgs = Organization.objects.all()
        if not orgs.exists():
            self.stdout.write(self.style.ERROR('No organizations found. Create an organization first.'))
            return
        
        self.stdout.write('\nAvailable Organizations:')
        for i, org in enumerate(orgs, 1):
            self.stdout.write(f'{i}. {org.name} ({org.organization_code})')
        
        # Get organization
        org_choice = input('\nSelect organization number: ')
        try:
            organization = orgs[int(org_choice) - 1]
        except (ValueError, IndexError):
            self.stdout.write(self.style.ERROR('Invalid selection'))
            return
        
        # Get admin details
        email = input('Email: ')
        full_name = input('Full Name: ')
        phone = input('Phone Number: ')
        password = input('Password: ')
        
        # Check if user exists
        if User.objects.filter(username=email).exists():
            user = User.objects.get(username=email)
            self.stdout.write(self.style.WARNING(f'User {email} already exists. Using existing user.'))
            
            # Check if already org admin
            if hasattr(user, 'org_admin_profile'):
                self.stdout.write(self.style.ERROR('User is already an organization admin.'))
                return
        else:
            # Create user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'✓ Created user: {email}'))
        
        # Create org admin profile
        org_admin = OrgAdmin.objects.create(
            user=user,
            organization=organization,
            full_name=full_name,
            phone_number=phone,
            is_primary_admin=True,
            can_add_therapists=True,
            can_edit_org_settings=True,
            can_view_analytics=True
        )
        
        # Create notification preferences
        NotificationPreferences.objects.create(
            org_admin=org_admin,
            new_member=True,
            new_session=True,
            session_cancelled=True,
            weekly_report=False,
            monthly_report=True
        )
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Organization admin created successfully!'))
        self.stdout.write(f'\nOrganization: {organization.name}')
        self.stdout.write(f'Email: {email}')
        self.stdout.write(f'Name: {full_name}')
        self.stdout.write(f'\nYou can now login at /org-admin/login')