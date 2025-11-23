
from django.contrib import admin
from .models import Message  # import your model

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender_patient', 'sender_therapist', 'session', 'timestamp', 'is_read')
    list_filter = ('is_read', 'timestamp')
    search_fields = ('sender__first_name', 'therapist__name', 'content')

# Register your models here.
