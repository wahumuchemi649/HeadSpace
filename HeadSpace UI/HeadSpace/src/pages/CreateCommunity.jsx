import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import './community.css';

const TOPICS = [
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

function CreateCommunity() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        description: '',
        topic: '',
        icon: null
    });
    const [step, setStep] = useState(1); // 1: Form, 2: Check similar
    const [similarCommunities, setSimilarCommunities] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNext = async () => {
        if (!form.name || !form.description || !form.topic) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('access_token');

        try {
            // Check for similar communities
            const res = await fetch(`${Api_Base}api/communities/check-similar/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    topic: form.topic
                })
            });

            const data = await res.json();

            if (data.exists) {
                setSimilarCommunities(data.suggestions);
                setStep(2); // Show similar communities
            } else {
                // No similar communities, create directly
                await createCommunity();
            }
        } catch (err) {
            console.error('Error checking similar communities:', err);
            alert('Error checking for similar communities. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const createCommunity = async () => {
        setIsSubmitting(true);
        const token = localStorage.getItem('access_token');

        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('description', form.description);
            formData.append('topic', form.topic);
            if (form.icon) {
                formData.append('icon', form.icon);
            }

            const res = await fetch(`${Api_Base}api/communities/create/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                alert('Community created successfully!');
                navigate(`/community/${data.community.id}`);
            } else {
                alert(data.error || 'Failed to create community');
            }
        } catch (err) {
            console.error('Error creating community:', err);
            alert('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const joinExistingCommunity = async (communityId) => {
        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${Api_Base}api/communities/${communityId}/join/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                navigate(`/community/${communityId}`);
            } else {
                alert('Failed to join community');
            }
        } catch (err) {
            console.error('Error joining community:', err);
        }
    };

    return (
        <div className="create-community-container">
            {step === 1 ? (
                <div className="create-form">
                    <h2>Start a New Community</h2>
                    <p>Create a safe space for people to connect and support each other</p>

                    <div className="form-group">
                        <label>Community Name *</label>
                        <input
                            type="text"
                            placeholder="e.g., Healing from Loss Together"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            maxLength={200}
                        />
                    </div>

                    <div className="form-group">
                        <label>Topic *</label>
                        <select
                            value={form.topic}
                            onChange={(e) => setForm({ ...form, topic: e.target.value })}
                        >
                            <option value="">Select a topic</option>
                            {TOPICS.map(topic => (
                                <option key={topic.value} value={topic.value}>
                                    {topic.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            placeholder="Describe what this community is about and who should join..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={6}
                        />
                        <span className="char-count">{form.description.length} characters</span>
                    </div>

                    <div className="form-group">
                        <label>Community Icon (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setForm({ ...form, icon: e.target.files[0] })}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            className="cancel-btn"
                            onClick={() => navigate('/communities')}
                        >
                            Cancel
                        </button>
                        <button
                            className="next-btn"
                            onClick={handleNext}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Checking...' : 'Next'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="similar-communities">
                    <h2>Similar Communities Found</h2>
                    <p>We found some communities that might be what you're looking for:</p>

                    <div className="suggestions-list">
                        {similarCommunities.map(comm => (
                            <div key={comm.id} className="suggestion-card">
                                <h3>{comm.name}</h3>
                                <span className="similarity-badge">{comm.similarity}</span>
                                <p>{comm.description}</p>
                                <div className="suggestion-meta">
                                    <span>👥 {comm.member_count} members</span>
                                    <span>Started by {comm.created_by}</span>
                                </div>
                                <button
                                    className="join-existing-btn"
                                    onClick={() => joinExistingCommunity(comm.id)}
                                >
                                    Join This Community
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="create-anyway">
                        <p>Don't see what you're looking for?</p>
                        <button
                            className="create-anyway-btn"
                            onClick={createCommunity}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create My Community Anyway'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreateCommunity;