// TherapistPricing.jsx - WITH COMMISSION CALCULATOR

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Api_Base } from './Api';
import { MdAttachMoney, MdSchedule, MdInfo, MdSave, MdTrendingUp } from 'react-icons/md';
import './TherapistPricing.css';

function TherapistPricing() {
    const navigate = useNavigate();
    const [therapistInfo, setTherapistInfo] = useState({
        name: '',
        email: '',
        phone: '',
        is_independent: false
    });
    const [pricing, setPricing] = useState({
        session_rate_45: 2500,
        session_rate_60: 3000
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Platform commission rate (10%)
    const PLATFORM_FEE_PERCENTAGE = 10;

    useEffect(() => {
        fetchPricing();
    }, []);

    const fetchPricing = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');

            if (!token) {
                navigate('TherapyLogin');
                return;
            }

            const response = await fetch(`${Api_Base}/therapist/pricing/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    const data = await response.json();
                    setError(data.message || 'Not authorized');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('💰 Pricing data:', data);

            setTherapistInfo(data.therapist);
            setPricing(data.pricing);

        } catch (error) {
            console.error('Error fetching pricing:', error);
            setError('Failed to load pricing settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccessMessage('');

        // Validation
        if (pricing.session_rate_45 < 1000) {
            setError('45-minute session rate must be at least KES 1,000');
            setIsSaving(false);
            return;
        }

        if (pricing.session_rate_60 < 1000) {
            setError('60-minute session rate must be at least KES 1,000');
            setIsSaving(false);
            return;
        }

        if (pricing.session_rate_60 <= pricing.session_rate_45) {
            setError('60-minute sessions must cost more than 45-minute sessions');
            setIsSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${Api_Base}/therapist/pricing/update/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pricing)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('✅ Pricing updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.error || 'Failed to update pricing');
            }
        } catch (error) {
            console.error('Error saving pricing:', error);
            setError('Network error. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate platform fee and net earnings
    const calculateEarnings = (rate) => {
        const platformFee = (rate * PLATFORM_FEE_PERCENTAGE) / 100;
        const netEarnings = rate - platformFee;
        return {
            platformFee: platformFee.toFixed(2),
            netEarnings: netEarnings.toFixed(2)
        };
    };

    const calculateRevenue = () => {
        const avg45 = 20; // Average 45-min sessions per month
        const avg60 = 10; // Average 60-min sessions per month
        
        const gross45 = pricing.session_rate_45 * avg45;
        const gross60 = pricing.session_rate_60 * avg60;
        const grossTotal = gross45 + gross60;
        
        const platformFeeTotal = (grossTotal * PLATFORM_FEE_PERCENTAGE) / 100;
        const netTotal = grossTotal - platformFeeTotal;

        return {
            gross45: gross45.toLocaleString(),
            gross60: gross60.toLocaleString(),
            grossTotal: grossTotal.toLocaleString(),
            platformFeeTotal: platformFeeTotal.toLocaleString(),
            netTotal: netTotal.toLocaleString()
        };
    };

    if (isLoading) {
        return (
            <div className="pricing-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading pricing settings...</p>
                </div>
            </div>
        );
    }

    if (!therapistInfo.is_independent) {
        return (
            <div className="pricing-container">
                <div className="error-state">
                    <MdInfo size={48} />
                    <h2>Organization Therapist</h2>
                    <p>{error || 'Your pricing is managed by your organization administrator.'}</p>
                    <button onClick={() => navigate('/therapist/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const revenue = calculateRevenue();
    const earnings45 = calculateEarnings(pricing.session_rate_45);
    const earnings60 = calculateEarnings(pricing.session_rate_60);

    return (
        <div className="pricing-container">
            <div className="pricing-header">
                <div>
                    <h1>💰 Session Pricing</h1>
                    <p className="pricing-subtitle">Set your rates for different session durations</p>
                </div>
                <div className="therapist-info-badge">
                    <div className="badge-label">Independent Practitioner</div>
                    <div className="badge-name">{therapistInfo.name}</div>
                </div>
            </div>

            {/* Platform Fee Notice */}
            <div className="platform-fee-notice">
                <div className="notice-icon">
                    <MdInfo size={24} />
                </div>
                <div className="notice-content">
                    <h4>Platform Fee: {PLATFORM_FEE_PERCENTAGE}%</h4>
                    <p>
                        HeadSpace charges a {PLATFORM_FEE_PERCENTAGE}% platform fee on each session. 
                        This covers payment processing, platform maintenance, booking management, and customer support.
                    </p>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="success-banner">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="error-banner">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    {error}
                </div>
            )}

            {/* Pricing Form */}
            <div className="pricing-content">
                <form onSubmit={handleSave} className="pricing-form">
                    <div className="session-types">
                        {/* 45-Minute Session */}
                        <div className="session-card">
                            <div className="session-header">
                                <MdSchedule size={28} color="#3d1d77" />
                                <div>
                                    <h3>45-Minute Session</h3>
                                    <p>Standard therapy session</p>
                                </div>
                            </div>

                            <div className="rate-input-group">
                                <label>Session Rate (Patient Pays)</label>
                                <div className="input-with-currency">
                                    <span className="currency-label">KES</span>
                                    <input
                                        type="number"
                                        value={pricing.session_rate_45}
                                        onChange={(e) => setPricing({
                                            ...pricing,
                                            session_rate_45: parseFloat(e.target.value) || 0
                                        })}
                                        min="1000"
                                        step="100"
                                        required
                                    />
                                </div>
                                <small>Recommended: KES 2,000 - 3,500 per session</small>
                            </div>

                            {/* Commission Breakdown */}
                            <div className="commission-breakdown">
                                <div className="breakdown-row">
                                    <span className="breakdown-label">Patient Pays:</span>
                                    <span className="breakdown-value">
                                        KES {pricing.session_rate_45.toLocaleString()}
                                    </span>
                                </div>
                                <div className="breakdown-row deduction">
                                    <span className="breakdown-label">
                                        Platform Fee ({PLATFORM_FEE_PERCENTAGE}%):
                                    </span>
                                    <span className="breakdown-value">
                                        - KES {earnings45.platformFee}
                                    </span>
                                </div>
                                <div className="breakdown-row earnings">
                                    <span className="breakdown-label">You Receive:</span>
                                    <span className="breakdown-value highlight">
                                        KES {earnings45.netEarnings}
                                    </span>
                                </div>
                            </div>

                            <div className="session-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Avg. sessions/month</span>
                                    <span className="stat-value">20</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Net revenue</span>
                                    <span className="stat-value highlight">
                                        KES {(parseFloat(earnings45.netEarnings) * 20).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 60-Minute Session */}
                        <div className="session-card featured">
                            <div className="featured-badge">Most Popular</div>
                            <div className="session-header">
                                <MdSchedule size={28} color="#61dafb" />
                                <div>
                                    <h3>60-Minute Session</h3>
                                    <p>Extended therapy session</p>
                                </div>
                            </div>

                            <div className="rate-input-group">
                                <label>Session Rate (Patient Pays)</label>
                                <div className="input-with-currency">
                                    <span className="currency-label">KES</span>
                                    <input
                                        type="number"
                                        value={pricing.session_rate_60}
                                        onChange={(e) => setPricing({
                                            ...pricing,
                                            session_rate_60: parseFloat(e.target.value) || 0
                                        })}
                                        min="1000"
                                        step="100"
                                        required
                                    />
                                </div>
                                <small>Recommended: KES 2,500 - 4,500 per session</small>
                            </div>

                            {/* Commission Breakdown */}
                            <div className="commission-breakdown">
                                <div className="breakdown-row">
                                    <span className="breakdown-label">Patient Pays:</span>
                                    <span className="breakdown-value">
                                        KES {pricing.session_rate_60.toLocaleString()}
                                    </span>
                                </div>
                                <div className="breakdown-row deduction">
                                    <span className="breakdown-label">
                                        Platform Fee ({PLATFORM_FEE_PERCENTAGE}%):
                                    </span>
                                    <span className="breakdown-value">
                                        - KES {earnings60.platformFee}
                                    </span>
                                </div>
                                <div className="breakdown-row earnings">
                                    <span className="breakdown-label">You Receive:</span>
                                    <span className="breakdown-value highlight">
                                        KES {earnings60.netEarnings}
                                    </span>
                                </div>
                            </div>

                            <div className="session-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Avg. sessions/month</span>
                                    <span className="stat-value">10</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Net revenue</span>
                                    <span className="stat-value highlight">
                                        KES {(parseFloat(earnings60.netEarnings) * 10).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Projection */}
                    <div className="revenue-projection">
                        <div className="projection-header">
                            <MdTrendingUp size={24} />
                            <h3>Monthly Revenue Projection</h3>
                        </div>
                        <div className="projection-content">
                            <div className="projection-section">
                                <h5>Gross Revenue (What Patients Pay)</h5>
                                <div className="projection-row">
                                    <span>45-minute sessions (20/month)</span>
                                    <span>KES {revenue.gross45}</span>
                                </div>
                                <div className="projection-row">
                                    <span>60-minute sessions (10/month)</span>
                                    <span>KES {revenue.gross60}</span>
                                </div>
                                <div className="projection-subtotal">
                                    <span>Gross Total</span>
                                    <span>KES {revenue.grossTotal}</span>
                                </div>
                            </div>

                            <div className="projection-section">
                                <h5>Platform Fees & Net Earnings</h5>
                                <div className="projection-row deduction">
                                    <span>Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                                    <span>- KES {revenue.platformFeeTotal}</span>
                                </div>
                                <div className="projection-total">
                                    <span>Net Earnings (You Receive)</span>
                                    <span className="total-amount">KES {revenue.netTotal}</span>
                                </div>
                            </div>
                        </div>
                        <small className="projection-note">
                            * Based on average booking rates. Actual revenue may vary.
                        </small>
                    </div>

                    {/* Pricing Guidelines */}
                    <div className="pricing-guidelines">
                        <h4>💡 Pricing Guidelines</h4>
                        <ul>
                            <li>
                                <strong>Market Rate:</strong> Most independent therapists in Kenya charge KES 2,500 - 4,000 per session
                            </li>
                            <li>
                                <strong>Premium Rate:</strong> Specialized services (trauma, couples therapy) can command KES 4,000 - 6,000
                            </li>
                            <li>
                                <strong>Duration Difference:</strong> 60-minute sessions typically cost 20-30% more than 45-minute sessions
                            </li>
                            <li>
                                <strong>Platform Fee:</strong> {PLATFORM_FEE_PERCENTAGE}% fee covers payment processing, booking management, and platform support
                            </li>
                            <li>
                                <strong>Competitive Pricing:</strong> Consider the {PLATFORM_FEE_PERCENTAGE}% fee when setting your rates to stay competitive
                            </li>
                        </ul>
                    </div>

                    {/* Save Button */}
                    <div className="form-actions">
                        <button type="submit" className="save-btn" disabled={isSaving}>
                            <MdSave size={20} />
                            {isSaving ? 'Saving...' : 'Save Pricing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TherapistPricing;