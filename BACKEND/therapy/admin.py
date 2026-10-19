from django import forms
from django.contrib import admin
from django.contrib.auth.models import User
from .models import therapists, TherapistAvailability
import secrets

class TherapistCreationForm(forms.ModelForm):
    email = forms.EmailField(required=True, help_text="Therapist's email address")
    
    class Meta:
        model = therapists
        fields = ['email', 'firstName', 'lastName', 'phoneNumber', 'description', 
                  'profile_pic', 'specialty_1', 'specialty_2', 'specialty_3']
    
    def save(self, commit=True):
        # Create user first
        email = self.cleaned_data['email']
        
        if User.objects.filter(username=email).exists():
            raise forms.ValidationError(f'User with email {email} already exists')
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=secrets.token_urlsafe(16)  # Random unused password
        )
        
        # Create therapist
        therapist = super().save(commit=False)
        therapist.user = user
        
        if commit:
            therapist.save()
        
        return therapist

class TherapistAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_email', 'phoneNumber', 'description')
    search_fields = ('firstName', 'lastName', 'user__email')
    list_filter = ('specialty_1',)
    
    def get_full_name(self, obj):
        return f"Dr. {obj.firstName} {obj.lastName}"
    get_full_name.short_description = 'Name'
    
    def get_email(self, obj):
        return obj.user.email if obj.user else 'No user'
    get_email.short_description = 'Email'
    
    def get_form(self, request, obj=None, **kwargs):
        # Use special form for creation only
        if obj is None:  # Creating new therapist
            kwargs['form'] = TherapistCreationForm
        return super().get_form(request, obj, **kwargs)

# Register models - DO THIS ONLY ONCE!
admin.site.register(therapists, TherapistAdmin)
admin.site.register(TherapistAvailability)