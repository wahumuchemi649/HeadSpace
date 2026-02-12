import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './community.css';

const TOPICS = [
    { value: 'all', label: 'All Topics' },
    { value: 'grief', label: 'Healing from Grief' },
    { value: 'anxiety', label: 'Managing Anxiety' },
    { value: 'depression', label: 'Depression Support' },
    { value: 'trauma', label: 'Trauma Recovery' },
    { value: 'relationships', label: 'Relationship Issues' },
    { value: 'self_care', label: 'Self-Care & Wellness' },
    { value: 'addiction', label: 'Addiction Recovery' },
    { value: 'parenting', label: 'Parenting Support' },
    { value: 'work_stress', label: 'Work & Career Stress' },
    { value: 'identity', label: 'Identity & Self-Discovery' },
    { value: 'other', label: 'Other' },
];

function CommunityList() {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCommunities();
    }, [selectedTopic, searchQuery]);

    const fetchCommunities = async () => {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            navigate('/Login');
            return;
        }

        try {
            let url = `${Api_Base}api/communities/?topic=${selectedTopic}`;
            if (searchQuery) {
                url += `&search=${searchQuery}`;
            }

            const res = await fetch(url, {
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

            const data = await res.json();
            setCommunities(data.communities || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching communities:', err);
            setLoading(false);
        }
    };

    const handleJoinCommunity = async (communityId) => {
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
                fetchCommunities(); // Refresh list
            } else {
                alert(data.error || 'Failed to join community');
            }
        } catch (err) {
            console.error('Error joining community:', err);
            alert('Network error. Please try again.');
        }
    };

    if (loading) {
        return <div className="loading">Loading communities...</div>;
    }

    return (
        <div className="community-container">
            <header className="community-header">
                <h1>Join a Community</h1>
                <p>Connect with others who understand what you're going through</p>
            </header>

            <div className="community-actions">
                
                <button
                    className="create-community-btn"
                    onClick={() => navigate('/CreateCommunity')}
                >
                    + Start New Community
                </button>

                <input
                    type="text"
                    className="search-input"
                    placeholder="Search communities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="topic-filters">
                {TOPICS.map(topic => (
                    <button
                        key={topic.value}
                        className={`topic-btn ${selectedTopic === topic.value ? 'active' : ''}`}
                        onClick={() => setSelectedTopic(topic.value)}
                    >
                        {topic.label}
                    </button>
                ))}
            </div>

            {communities.length === 0 ? (
                <div className="no-communities">
                    <p>No communities found. Be the first to create one!</p>
                </div>
            ) : (
                <div className="communities-grid">
                    {communities.map(community => (
                        <div key={community.id} className="community-card">
                            {community.icon && (
                                <img src={community.icon} alt={community.name} className="community-icon" />
                            )}
                            
                            <h3>{community.name}</h3>
                            <span className="topic-badge">{community.topic_display}</span>
                            
                            <p className="community-description">{community.description}</p>
                            
                            <div className="community-meta">
                                <span className="member-count">👥 {community.member_count} members</span>
                                <span className="creator">Started by {community.created_by}</span>
                            </div>

                            {community.is_member ? (
                                <button
                                    className="view-btn"
                                    onClick={() => navigate(`/community/${community.id}`)}
                                >
                                    View Community
                                </button>
                            ) : (
                                <button
                                    className="join-btn"
                                    onClick={() => handleJoinCommunity(community.id)}
                                >
                                    Join Community
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommunityList;