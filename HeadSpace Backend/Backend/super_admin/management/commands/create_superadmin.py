# super_admin/management/commands/create_superadmin.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from super_admin.models import SuperAdmin

class Command(BaseCommand):
    help = 'Create a super admin user'

    def handle(self, *args, **kwargs):
        email = input("Enter super admin email: ")
        full_name = input("Enter full name: ")
        password = input("Enter password: ")
        
        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=full_name.split()[0] if ' ' in full_name else full_name,
            is_staff=True,
            is_superuser=True
        )
        
        # Create super admin profile
        SuperAdmin.objects.create(
            user=user,
            full_name=full_name
        )
        
        self.stdout.write(self.style.SUCCESS(f'✅ Super admin created: {email}'))