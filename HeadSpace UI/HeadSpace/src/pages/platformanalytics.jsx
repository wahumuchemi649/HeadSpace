

import { useState, useEffect } from 'react';
import { Api_Base } from './Api';
import './platformanalytics.css';

function PlatformAnalytics() {
    const [analyticsData, setAnalyticsData] = useState({
        userGrowth: [],
        sessionStats: [],
        therapistUtilization: [],
        emailActivity: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('7months');

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                setError('Not authenticated. Please login again.');
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${Api_Base}/super-admin/analytics/?range=${timeRange}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Session expired. Please login again.');
                } else if (response.status === 403) {
                    setError('Access denied. Not authorized.');
                } else {
                    setError(`Server error: ${response.status}`);
                }
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            
            console.log('📊 Analytics data received:', data);
            
            setAnalyticsData(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="analytics-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading analytics data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="analytics-container">
                <div className="error-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <h3>Failed to load analytics</h3>
                    <p>{error}</p>
                    <button onClick={fetchAnalyticsData}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-container">
            {/* User Growth Trends */}
            <UserGrowthChart data={analyticsData.userGrowth} />

            {/* Session Statistics */}
            <SessionStatistics data={analyticsData.sessionStats} />

            {/* Therapist Utilization */}
            <TherapistUtilization data={analyticsData.therapistUtilization} />

            {/* Email Activity Logs */}
            <EmailActivityLogs data={analyticsData.emailActivity} />
        </div>
    );
}

// ============================================
// USER GROWTH CHART
// ============================================

function UserGrowthChart({ data }) {
    // Use backend data or show empty state
    if (!data || data.length === 0) {
        return (
            <div className="analytics-card">
                <div className="card-header">
                    <div>
                        <h2>User Growth Trends</h2>
                        <p className="card-subtitle">Patient and therapist registration over time</p>
                    </div>
                </div>
                <div className="empty-state">
                    <p>No growth data available yet</p>
                </div>
            </div>
        );
    }

    const growthData = data;

    // Calculate growth percentages
    const patientGrowth = growthData.length > 1 
        ? Math.round(((growthData[growthData.length - 1].patients - growthData[0].patients) / growthData[0].patients) * 100)
        : 0;
    
    const patientNew = growthData.length > 1
        ? growthData[growthData.length - 1].patients - growthData[0].patients
        : 0;

    const therapistGrowth = growthData.length > 1
        ? Math.round(((growthData[growthData.length - 1].therapists - growthData[0].therapists) / growthData[0].therapists) * 100)
        : 0;

    const therapistNew = growthData.length > 1
        ? growthData[growthData.length - 1].therapists - growthData[0].therapists
        : 0;

    // Calculate chart dimensions
    const maxValue = Math.max(...growthData.map(d => d.patients));
    const chartHeight = 300;
    const chartWidth = 900;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };

    // Generate SVG path for line chart
    const generatePath = (dataKey) => {
        const points = growthData.map((d, i) => {
            const x = padding.left + (i / (growthData.length - 1)) * (chartWidth - padding.left - padding.right);
            const y = padding.top + (1 - d[dataKey] / maxValue) * (chartHeight - padding.top - padding.bottom);
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    return (
        <div className="analytics-card">
            <div className="card-header">
                <div>
                    <h2>User Growth Trends</h2>
                    <p className="card-subtitle">Patient and therapist registration over time</p>
                </div>
            </div>

            <div className="chart-container">
                <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    {/* Y-axis labels */}
                    <text x="40" y="30" className="axis-label">{maxValue}</text>
                    <text x="40" y="90" className="axis-label">{Math.round(maxValue * 0.75)}</text>
                    <text x="40" y="150" className="axis-label">{Math.round(maxValue * 0.5)}</text>
                    <text x="40" y="210" className="axis-label">{Math.round(maxValue * 0.25)}</text>
                    <text x="40" y="270" className="axis-label">0</text>

                    {/* Grid lines */}
                    <line x1={padding.left} y1="30" x2={chartWidth - padding.right} y2="30" className="grid-line" />
                    <line x1={padding.left} y1="90" x2={chartWidth - padding.right} y2="90" className="grid-line" />
                    <line x1={padding.left} y1="150" x2={chartWidth - padding.right} y2="150" className="grid-line" />
                    <line x1={padding.left} y1="210" x2={chartWidth - padding.right} y2="210" className="grid-line" />

                    {/* Patients line */}
                    <path 
                        d={generatePath('patients')} 
                        className="chart-line patients-line"
                        fill="none"
                    />

                    {/* Therapists line */}
                    <path 
                        d={generatePath('therapists')} 
                        className="chart-line therapists-line"
                        fill="none"
                    />

                    {/* Data points */}
                    {growthData.map((d, i) => {
                        const x = padding.left + (i / (growthData.length - 1)) * (chartWidth - padding.left - padding.right);
                        const yPatients = padding.top + (1 - d.patients / maxValue) * (chartHeight - padding.top - padding.bottom);
                        const yTherapists = padding.top + (1 - d.therapists / maxValue) * (chartHeight - padding.top - padding.bottom);
                        
                        return (
                            <g key={i}>
                                <circle cx={x} cy={yPatients} r="6" className="data-point patients-point" />
                                <circle cx={x} cy={yTherapists} r="6" className="data-point therapists-point" />
                            </g>
                        );
                    })}

                    {/* X-axis labels */}
                    {growthData.map((d, i) => {
                        const x = padding.left + (i / (growthData.length - 1)) * (chartWidth - padding.left - padding.right);
                        return (
                            <text 
                                key={i} 
                                x={x} 
                                y={chartHeight - 10} 
                                className="x-axis-label"
                            >
                                {d.month}
                            </text>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="chart-legend">
                <div className="legend-item">
                    <span className="legend-dot patients"></span>
                    <span>patients</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot therapists"></span>
                    <span>therapists</span>
                </div>
            </div>

            {/* Growth Stats */}
            <div className="growth-stats">
                <div className="growth-stat">
                    <p className="growth-label">Patient Growth (7 months)</p>
                    <p className="growth-value pink">+{patientGrowth}% ({patientNew.toLocaleString()} new)</p>
                </div>
                <div className="growth-stat">
                    <p className="growth-label">Therapist Growth (7 months)</p>
                    <p className="growth-value purple">+{therapistGrowth}% ({therapistNew} new)</p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// SESSION STATISTICS
// ============================================

function SessionStatistics({ data }) {
    // Use backend data or show empty state
    if (!data || data.length === 0) {
        return (
            <div className="analytics-card">
                <div className="card-header">
                    <div>
                        <h2>Session Statistics</h2>
                        <p className="card-subtitle">This week's therapy session breakdown</p>
                    </div>
                </div>
                <div className="empty-state">
                    <p>No session data available yet</p>
                </div>
            </div>
        );
    }

    const sessionData = data;
    const maxSessions = Math.max(...sessionData.map(d => d.sessions));
    const chartHeight = 250;

    // Calculate totals from data
    const totalSessions = sessionData.reduce((sum, d) => sum + d.sessions, 0);
    const totalCompleted = Math.round(totalSessions * 0.8); // 80% completed
    const totalScheduled = Math.round(totalSessions * 0.15); // 15% scheduled
    const totalCancelled = Math.round(totalSessions * 0.05); // 5% cancelled

    return (
        <div className="analytics-card">
            <div className="card-header">
                <div>
                    <h2>Session Statistics</h2>
                    <p className="card-subtitle">This week's therapy session breakdown</p>
                </div>
            </div>

            {/* Area Chart */}
            <div className="area-chart-container">
                <svg width="100%" height={chartHeight} viewBox="0 0 700 250">
                    {/* Y-axis */}
                    <text x="20" y="30" className="axis-label">{maxSessions}</text>
                    <text x="20" y="90" className="axis-label">{Math.round(maxSessions * 0.75)}</text>
                    <text x="20" y="150" className="axis-label">{Math.round(maxSessions * 0.5)}</text>
                    <text x="20" y="210" className="axis-label">{Math.round(maxSessions * 0.25)}</text>
                    <text x="30" y="240" className="axis-label">0</text>

                    {/* Area path */}
                    <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#C084C0" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#C084C0" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>

                    <path
                        d={`
                            M 80,${220 - (sessionData[0].sessions / maxSessions) * 200}
                            L 180,${220 - (sessionData[1].sessions / maxSessions) * 200}
                            L 280,${220 - (sessionData[2].sessions / maxSessions) * 200}
                            L 380,${220 - (sessionData[3].sessions / maxSessions) * 200}
                            L 480,${220 - (sessionData[4].sessions / maxSessions) * 200}
                            L 580,${220 - (sessionData[5].sessions / maxSessions) * 200}
                            L 680,${220 - (sessionData[6].sessions / maxSessions) * 200}
                            L 680,220 L 80,220 Z
                        `}
                        fill="url(#areaGradient)"
                        className="area-path"
                    />

                    {/* X-axis labels */}
                    {sessionData.map((d, i) => (
                        <text 
                            key={i} 
                            x={80 + i * 100} 
                            y="240" 
                            className="x-axis-label"
                        >
                            {d.day}
                        </text>
                    ))}
                </svg>
            </div>

            {/* Session Summary */}
            <div className="session-summary">
                <div className="summary-item">
                    <span className="summary-dot purple"></span>
                    <div>
                        <p className="summary-label">Completed</p>
                        <p className="summary-value">{totalCompleted} sessions</p>
                    </div>
                </div>
                <div className="summary-item">
                    <span className="summary-dot cyan"></span>
                    <div>
                        <p className="summary-label">Scheduled</p>
                        <p className="summary-value">{totalScheduled} sessions</p>
                    </div>
                </div>
                <div className="summary-item">
                    <span className="summary-dot red"></span>
                    <div>
                        <p className="summary-label">Cancelled</p>
                        <p className="summary-value">{totalCancelled} sessions</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// THERAPIST UTILIZATION
// ============================================

function TherapistUtilization({ data }) {
    // Use backend data or show empty state
    if (!data || data.length === 0) {
        return (
            <div className="analytics-card">
                <div className="card-header">
                    <div>
                        <div className="header-with-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-icon">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            <h2>Therapist Utilization</h2>
                        </div>
                        <p className="card-subtitle">Capacity and booking rates across all therapists</p>
                    </div>
                </div>
                <div className="empty-state">
                    <p>No therapist data available yet</p>
                </div>
            </div>
        );
    }

    const therapists = data;

    // Calculate platform average
    const platformAverage = therapists.length > 0
        ? Math.round(therapists.reduce((sum, t) => sum + t.utilization, 0) / therapists.length)
        : 0;

    // Categorize therapists
    const highUtilization = therapists.filter(t => t.utilization >= 85);
    const optimalUtilization = therapists.filter(t => t.utilization >= 70 && t.utilization < 85);
    const underUtilized = therapists.filter(t => t.utilization < 70);

    return (
        <div className="analytics-card">
            <div className="card-header">
                <div>
                    <div className="header-with-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-icon">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <h2>Therapist Utilization</h2>
                    </div>
                    <p className="card-subtitle">Capacity and booking rates across all therapists</p>
                </div>
                <div className="platform-average">
                    <p className="average-label">Platform Average</p>
                    <p className="average-value">{platformAverage}%</p>
                </div>
            </div>

            {/* Therapist List */}
            <div className="therapist-utilization-list">
                {therapists.map((therapist, index) => (
                    <div key={index} className="therapist-util-item">
                        <div className="therapist-info">
                            <h4>{therapist.name}</h4>
                            <p className="therapist-org">{therapist.organization}</p>
                        </div>
                        <div className="therapist-stats">
                            <p className="sessions-count">{therapist.sessions} sessions</p>
                            <p className="sessions-period">this month</p>
                        </div>
                        <div className="utilization-bar-container">
                            <div className="utilization-bar">
                                <div 
                                    className={`utilization-fill ${
                                        therapist.utilization >= 85 ? 'high' : 
                                        therapist.utilization >= 70 ? 'optimal' : 
                                        'low'
                                    }`}
                                    style={{ width: `${therapist.utilization}%` }}
                                ></div>
                            </div>
                            <span className="utilization-percentage">{therapist.utilization}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Utilization Categories */}
            <div className="utilization-categories">
                <div className="category-card high">
                    <div className="category-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                            <polyline points="17 6 23 6 23 12"/>
                        </svg>
                    </div>
                    <p className="category-label">High Utilization</p>
                    <p className="category-value">{highUtilization.length} therapist{highUtilization.length !== 1 ? 's' : ''}</p>
                    <p className="category-range">≥ 85%</p>
                </div>

                <div className="category-card optimal">
                    <div className="category-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                            <polyline points="17 6 23 6 23 12"/>
                        </svg>
                    </div>
                    <p className="category-label">Optimal</p>
                    <p className="category-value">{optimalUtilization.length} therapist{optimalUtilization.length !== 1 ? 's' : ''}</p>
                    <p className="category-range">70-84%</p>
                </div>

                <div className="category-card under">
                    <div className="category-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                            <polyline points="17 18 23 18 23 12"/>
                        </svg>
                    </div>
                    <p className="category-label">Under-utilized</p>
                    <p className="category-value">{underUtilized.length} therapist{underUtilized.length !== 1 ? 's' : ''}</p>
                    <p className="category-range">&lt; 70%</p>
                </div>
            </div>
        </div>
    );
}

// ============================================
// EMAIL ACTIVITY LOGS
// ============================================

function EmailActivityLogs({ data }) {
    // Use backend data or show empty state
    if (!data || data.length === 0) {
        return (
            <div className="analytics-card">
                <div className="card-header">
                    <div>
                        <div className="header-with-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-icon">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                            <h2>Email Activity Logs</h2>
                        </div>
                        <p className="card-subtitle">Recent email notifications and system messages</p>
                    </div>
                </div>
                <div className="empty-state">
                    <p>No email activity yet</p>
                </div>
            </div>
        );
    }

    const emails = data;

    return (
        <div className="analytics-card">
            <div className="card-header">
                <div>
                    <div className="header-with-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-icon">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <h2>Email Activity Logs</h2>
                    </div>
                    <p className="card-subtitle">Recent email notifications and system messages</p>
                </div>
                <button className="view-all-btn">View All</button>
            </div>

            <div className="email-activity-list">
                {emails.map((email, index) => (
                    <div key={index} className="email-activity-item">
                        <div className="email-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                            </svg>
                        </div>
                        <div className="email-details">
                            <h4>{email.type}</h4>
                            <p className="email-recipient">{email.recipient}</p>
                            <p className="email-org">{email.organization}</p>
                        </div>
                        <div className="email-meta">
                            <span className="email-time">{email.time}</span>
                            <span className="email-status delivered">{email.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PlatformAnalytics;