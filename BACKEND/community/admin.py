from django.contrib import admin
from .models import Community, CommunityMember, CommunityPost, Comment, PostLike

@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('name', 'topic', 'member_count', 'created_by', 'created_at', 'is_active')
    list_filter = ('topic', 'is_private', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(CommunityMember)
class CommunityMemberAdmin(admin.ModelAdmin):
    list_display = ('patient', 'community', 'role', 'joined_at')
    list_filter = ('role', 'joined_at')

@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'community', 'author', 'likes_count', 'comments_count', 'created_at')
    list_filter = ('community', 'is_pinned', 'created_at')

admin.site.register(Comment)
admin.site.register(PostLike)

# Register your models here.
