from django.db import models
from patients.models import patient
from django.utils.text import slugify

class Community(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField()
    icon = models.ImageField(upload_to='community_icons/', null=True, blank=True)
    
    # Category/Topic
    TOPICS = [
        ('grief', 'Healing from Grief'),
        ('anxiety', 'Managing Anxiety'),
        ('depression', 'Depression Support'),
        ('trauma', 'Trauma Recovery'),
        ('relationships', 'Relationship Issues'),
        ('self_care', 'Self-Care & Wellness'),
        ('addiction', 'Addiction Recovery'),
        ('parenting', 'Parenting Support'),
        ('work_stress', 'Work & Career Stress'),
        ('identity', 'Identity & Self-Discovery'),
        ('other', 'Other'),
    ]
    topic = models.CharField(max_length=50, choices=TOPICS)
    
    # Creator & Stats
    created_by = models.ForeignKey(patient, on_delete=models.SET_NULL, null=True, related_name='created_communities')
    created_at = models.DateTimeField(auto_now_add=True)
    member_count = models.IntegerField(default=1)  # Creator is first member
    
    # Settings
    is_private = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-member_count', '-created_at']
        verbose_name_plural = 'Communities'
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class CommunityMember(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='members')
    patient = models.ForeignKey(patient, on_delete=models.CASCADE, related_name='community_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    ROLES = [
        ('member', 'Member'),
        ('moderator', 'Moderator'),
        ('creator', 'Creator'),
    ]
    role = models.CharField(max_length=20, choices=ROLES, default='member')
    
    class Meta:
        unique_together = ['community', 'patient']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.patient.firstName} in {self.community.name}"


class CommunityPost(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(patient, on_delete=models.CASCADE, related_name='community_posts')
    title = models.CharField(max_length=300, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Engagement
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    
    # Moderation
    is_pinned = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
    
    def __str__(self):
        return f"{self.title or self.content[:50]} by {self.author.firstName}"


class Comment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(patient, on_delete=models.CASCADE, related_name='community_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    likes_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.author.firstName} on {self.post.id}"


class PostLike(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='likes')
    patient = models.ForeignKey(patient, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['post', 'patient']

# Create your models here.
