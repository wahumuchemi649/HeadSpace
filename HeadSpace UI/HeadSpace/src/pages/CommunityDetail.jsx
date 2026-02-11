import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './community.css';

function CommunityDetail() {
    const { communityId } = useParams();
    const navigate = useNavigate();
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [showPostForm, setShowPostForm] = useState(false);

    useEffect(() => {
        fetchCommunityDetails();
    }, [communityId]);

    const fetchCommunityDetails = async () => {
        const token = localStorage.getItem('access_token');

        if (!token) {
            navigate('/Login');
            return;
        }

        try {
            const res = await fetch(`${Api_Base}api/communities/${communityId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.status === 401) {
                localStorage.clear();
                navigate('/Login');
                return;
            }

            if (!res.ok) {
                throw new Error('Failed to fetch community');
            }

            const data = await res.json();
            setCommunity(data.community);
            setPosts(data.posts);
            setIsMember(data.is_member);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching community:', err);
            setLoading(false);
        }
    };

    const handleJoinCommunity = async () => {
        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${Api_Base}api/communities/${communityId}/join/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                fetchCommunityDetails(); // Refresh
            } else {
                alert(data.error || 'Failed to join community');
            }
        } catch (err) {
            console.error('Error joining community:', err);
            alert('Network error. Please try again.');
        }
    };

    const handleLeaveCommunity = async () => {
        if (!confirm('Are you sure you want to leave this community?')) {
            return;
        }

        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${Api_Base}api/communities/${communityId}/leave/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message);
                navigate('/communities');
            } else {
                alert(data.error || 'Failed to leave community');
            }
        } catch (err) {
            console.error('Error leaving community:', err);
            alert('Network error. Please try again.');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();

        if (!newPost.content.trim()) {
            alert('Post content is required');
            return;
        }

        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${Api_Base}api/communities/${communityId}/posts/create/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPost)
            });

            if (res.ok) {
                setNewPost({ title: '', content: '' });
                setShowPostForm(false);
                fetchCommunityDetails(); // Refresh posts
            } else {
                alert('Failed to create post');
            }
        } catch (err) {
            console.error('Error creating post:', err);
            alert('Network error. Please try again.');
        }
    };

    if (loading) {
        return <div className="loading">Loading community...</div>;
    }

    if (!community) {
        return (
            <div className="error-page">
                <h2>Community not found</h2>
                <button onClick={() => navigate('/communities')}>Back to Communities</button>
            </div>
        );
    }

    return (
        <div className="community-detail-container">
            {/* Community Header */}
            <div className="community-detail-header">
                <button className="back-btn" onClick={() => navigate('/communities')}>
                    ← Back to Communities
                </button>

                <div className="community-info">
                    {community.icon && (
                        <img src={community.icon} alt={community.name} className="community-icon-large" />
                    )}
                    <div className="community-text">
                        <h1>{community.name}</h1>
                        <span className="topic-badge-large">{community.topic_display}</span>
                        <p className="community-description-full">{community.description}</p>
                        <div className="community-stats">
                            <span>👥 {community.member_count} members</span>
                            <span>Started by {community.created_by}</span>
                            <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="community-actions-header">
                    {isMember ? (
                        <>
                            <button className="new-post-btn" onClick={() => setShowPostForm(!showPostForm)}>
                                + New Post
                            </button>
                            <button className="leave-btn" onClick={handleLeaveCommunity}>
                                Leave Community
                            </button>
                        </>
                    ) : (
                        <button className="join-btn-large" onClick={handleJoinCommunity}>
                            Join Community
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            {isMember ? (
                <div className="community-content">
                    {/* New Post Form */}
                    {showPostForm && (
                        <div className="new-post-form">
                            <h3>Create a Post</h3>
                            <form onSubmit={handleCreatePost}>
                                <input
                                    type="text"
                                    placeholder="Post Title (Optional)"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                    maxLength={300}
                                />
                                <textarea
                                    placeholder="What's on your mind?"
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                    rows={5}
                                    required
                                />
                                <div className="form-actions">
                                    <button type="button" onClick={() => setShowPostForm(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit">Post</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Posts Feed */}
                    <div className="posts-feed">
                        <h2>Community Posts</h2>
                        
                        {posts.length === 0 ? (
                            <div className="no-posts">
                                <p>No posts yet. Be the first to share something!</p>
                            </div>
                        ) : (
                            <div className="posts-list">
                                {posts.map(post => (
                                    <div key={post.id} className="post-card">
                                        {post.is_pinned && (
                                            <span className="pinned-badge">📌 Pinned</span>
                                        )}
                                        
                                        <div className="post-header">
                                            <strong>{post.author}</strong>
                                            <span className="post-time">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {post.title && <h3 className="post-title">{post.title}</h3>}
                                        
                                        <p className="post-content">{post.content}</p>

                                        <div className="post-footer">
                                            <button className="post-action">
                                                ❤️ {post.likes_count}
                                            </button>
                                            <button className="post-action">
                                                💬 {post.comments_count}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="not-member-message">
                    <h2>Join this community to view posts</h2>
                    <p>Connect with {community.member_count} members who share similar experiences</p>
                    <button className="join-btn-large" onClick={handleJoinCommunity}>
                        Join Community
                    </button>
                </div>
            )}
        </div>
    );
}

export default CommunityDetail;