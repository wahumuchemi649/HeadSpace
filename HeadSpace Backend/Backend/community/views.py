from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from patients.models import patient
from .models import Community, CommunityMember, CommunityPost, Comment
import re


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_communities(request):
    """List all active communities with filter options"""
    topic = request.GET.get('topic')
    search = request.GET.get('search')
    
    communities = Community.objects.filter(is_active=True)
    
    # Filter by topic
    if topic and topic != 'all':
        communities = communities.filter(topic=topic)
    
    # Search by name or description
    if search:
        communities = communities.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )
    
    # Get current user
    user = request.user
    try:
        current_patient = patient.objects.get(user=user)
    except patient.DoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=404)
    
    # Get user's memberships
    user_memberships = CommunityMember.objects.filter(patient=current_patient).values_list('community_id', flat=True)
    
    data = []
    for c in communities:
        data.append({
            'id': c.id,
            'name': c.name,
            'slug': c.slug,
            'description': c.description,
            'topic': c.topic,
            'topic_display': c.get_topic_display(),
            'icon': c.icon.url if c.icon else None,
            'member_count': c.member_count,
            'created_by': f"{c.created_by.firstName} {c.created_by.lastName}" if c.created_by else "Unknown",
            'created_at': c.created_at.isoformat(),
            'is_member': c.id in user_memberships,
        })
    
    return Response({
        'communities': data,
        'total': len(data)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_similar_communities(request):
    """Check if similar communities exist before creating new one"""
    name = request.data.get('name', '').strip()
    description = request.data.get('description', '').strip()
    topic = request.data.get('topic')
    
    if not name:
        return Response({'error': 'Community name is required'}, status=400)
    
    # Extract keywords from name and description
    keywords = re.findall(r'\w+', (name + ' ' + description).lower())
    keywords = [k for k in keywords if len(k) > 3]  # Filter short words
    
    # Search for similar communities
    similar = Community.objects.filter(is_active=True)
    
    # Exact name match
    exact_match = similar.filter(name__iexact=name).first()
    if exact_match:
        return Response({
            'exists': True,
            'exact_match': True,
            'suggestions': [{
                'id': exact_match.id,
                'name': exact_match.name,
                'description': exact_match.description,
                'topic_display': exact_match.get_topic_display(),
                'member_count': exact_match.member_count,
                'created_by': f"{exact_match.created_by.firstName} {exact_match.created_by.lastName}" if exact_match.created_by else "Unknown",
                'similarity': 'Exact match'
            }]
        })
    
    # Similar by topic and keywords
    if topic:
        similar = similar.filter(topic=topic)
    
    suggestions = []
    for comm in similar[:5]:  # Check top 5
        comm_text = (comm.name + ' ' + comm.description).lower()
        matches = sum(1 for kw in keywords if kw in comm_text)
        
        if matches >= 2:  # At least 2 keyword matches
            suggestions.append({
                'id': comm.id,
                'name': comm.name,
                'description': comm.description,
                'topic_display': comm.get_topic_display(),
                'member_count': comm.member_count,
                'created_by': f"{comm.created_by.firstName} {comm.created_by.lastName}" if comm.created_by else "Unknown",
                'similarity': f"{matches} similar keywords"
            })
    
    if suggestions:
        return Response({
            'exists': True,
            'exact_match': False,
            'suggestions': suggestions
        })
    
    return Response({
        'exists': False,
        'suggestions': []
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_community(request):
    """Create a new community"""
    user = request.user
    
    try:
        current_patient = patient.objects.get(user=user)
    except patient.DoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=404)
    
    name = request.data.get('name', '').strip()
    description = request.data.get('description', '').strip()
    topic = request.data.get('topic')
    icon = request.FILES.get('icon')
    
    # Validation
    if not name or len(name) < 3:
        return Response({'error': 'Community name must be at least 3 characters'}, status=400)
    
    if not description or len(description) < 10:
        return Response({'error': 'Description must be at least 10 characters'}, status=400)
    
    if not topic:
        return Response({'error': 'Please select a topic'}, status=400)
    
    # Check if name already exists
    if Community.objects.filter(name__iexact=name).exists():
        return Response({'error': 'A community with this name already exists'}, status=400)
    
    try:
        # Create community
        community = Community.objects.create(
            name=name,
            description=description,
            topic=topic,
            created_by=current_patient,
            icon=icon,
            member_count=1
        )
        
        # Add creator as first member with creator role
        CommunityMember.objects.create(
            community=community,
            patient=current_patient,
            role='creator'
        )
        
        return Response({
            'success': True,
            'message': 'Community created successfully!',
            'community': {
                'id': community.id,
                'name': community.name,
                'slug': community.slug,
                'description': community.description,
                'topic': community.topic,
                'topic_display': community.get_topic_display()
            }
        }, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_community(request, community_id):
    """Join a community"""
    user = request.user
    
    try:
        current_patient = patient.objects.get(user=user)
        community = Community.objects.get(id=community_id, is_active=True)
    except patient.DoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=404)
    except Community.DoesNotExist:
        return Response({'error': 'Community not found'}, status=404)
    
    # Check if already a member
    if CommunityMember.objects.filter(community=community, patient=current_patient).exists():
        return Response({'error': 'You are already a member of this community'}, status=400)
    
    # Add member
    CommunityMember.objects.create(
        community=community,
        patient=current_patient,
        role='member'
    )
    
    # Update member count
    community.member_count += 1
    community.save()
    
    return Response({
        'success': True,
        'message': f'Successfully joined {community.name}'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def leave_community(request, community_id):
    """Leave a community"""
    user = request.user
    
    try:
        current_patient = patient.objects.get(user=user)
        community = Community.objects.get(id=community_id)
        membership = CommunityMember.objects.get(community=community, patient=current_patient)
    except patient.DoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=404)
    except Community.DoesNotExist:
        return Response({'error': 'Community not found'}, status=404)
    except CommunityMember.DoesNotExist:
        return Response({'error': 'You are not a member of this community'}, status=400)
    
    # Don't allow creator to leave
    if membership.role == 'creator':
        return Response({'error': 'Creator cannot leave the community'}, status=400)
    
    # Remove membership
    membership.delete()
    
    # Update member count
    community.member_count = max(0, community.member_count - 1)
    community.save()
    
    return Response({
        'success': True,
        'message': f'Successfully left {community.name}'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_detail(request, community_id):
    """Get community details and posts"""
    user = request.user
    
    try:
        current_patient = patient.objects.get(user=user)
        community = Community.objects.get(id=community_id, is_active=True)
    except patient.DoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=404)
    except Community.DoesNotExist:
        return Response({'error': 'Community not found'}, status=404)
    
    # Check membership
    is_member = CommunityMember.objects.filter(community=community, patient=current_patient).exists()
    
    # Get posts (only if member)
    posts_data = []
    if is_member:
        posts = CommunityPost.objects.filter(community=community, is_hidden=False)[:20]
        
        for post in posts:
            posts_data.append({
                'id': post.id,
                'author': f"{post.author.firstName} {post.author.lastName}",
                'author_id': post.author.id,
                'title': post.title,
                'content': post.content,
                'created_at': post.created_at.isoformat(),
                'likes_count': post.likes_count,
                'comments_count': post.comments_count,
                'is_pinned': post.is_pinned
            })
    
    return Response({
        'community': {
            'id': community.id,
            'name': community.name,
            'description': community.description,
            'topic': community.topic,
            'topic_display': community.get_topic_display(),
            'member_count': community.member_count,
            'created_by': f"{community.created_by.firstName} {community.created_by.lastName}" if community.created_by else "Unknown",
            'created_at': community.created_at.isoformat(),
            'icon': community.icon.url if community.icon else None,
        },
        'is_member': is_member,
        'posts': posts_data
    })
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request, community_id):
    """Create a new post in community"""
    user = request.user
    
    try:
        current_patient = patient.objects.get(user=user)
        community = Community.objects.get(id=community_id, is_active=True)
    except patient.DoesNotExist:
        return Response({'error': 'Patient profile not found'}, status=404)
    except Community.DoesNotExist:
        return Response({'error': 'Community not found'}, status=404)
    
    # Check if user is a member
    if not CommunityMember.objects.filter(community=community, patient=current_patient).exists():
        return Response({'error': 'You must be a member to post'}, status=403)
    
    title = request.data.get('title', '').strip()
    content = request.data.get('content', '').strip()
    
    if not content:
        return Response({'error': 'Post content is required'}, status=400)
    
    try:
        post = CommunityPost.objects.create(
            community=community,
            author=current_patient,
            title=title,
            content=content
        )
        
        return Response({
            'success': True,
            'post': {
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'created_at': post.created_at.isoformat()
            }
        }, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Create your views here.
