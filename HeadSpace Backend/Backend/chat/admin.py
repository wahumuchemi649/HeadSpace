from django.contrib import admin

from .models import Messages

@admin.register(Messages)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender_type', 'sender_id', 'session', 'created_at')
    list_filter = ('sender_type', 'created_at')
    search_fields = ('message_text',)

# Register your models here.
