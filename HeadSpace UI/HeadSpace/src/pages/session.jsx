// Booking.jsx - UPDATED with fair system, keeping your UI

import './session.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Api_Base } from './Api'
import { FileChartLine } from 'lucide-react'

// Your existing Cards component (unchanged)
function Cards({ onselect, therapists, selectedTherapist }) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        if (therapists.length <= 3) return

        const timer = setInterval(() => {
            setIndex(prev => (prev + 3) % therapists.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [therapists])

    let visibleTherapists = []

    if (therapists.length > 0) {
        const count = Math.min(3, therapists.length)
        visibleTherapists = Array.from({ length: count }, (_, i) =>
            therapists[(index + i) % therapists.length]
        )
    }

    return (
        <div className='therapist-container'>
            {visibleTherapists.map((t) => (
                <div
                    className={`card ${selectedTherapist?.id === t.id ? 'selected' : ''}`}
                    key={t.id}
                    onClick={() => onselect(t)}
                    style={{
                        cursor: "pointer",
                        border: selectedTherapist?.id === t.id ? "3px solid #4a90e2" : "1px solid #ccc",
                        padding: "10px"
                    }}
                >
                    <img src={t.profile_pic} alt={t.profile_pic} />
                    <h3>{t.firstName} {t.lastName}</h3>
                    <p>{t.specialty_1}</p>
                    <p>{t.specialty_2}</p>
                    <p>{t.specialty_3}</p>
                    
                    {/* NEW: Show pricing badge */}
                    {t.is_free ? (
                        <div style={{
                            background: '#DEF7EC',
                            color: '#03543F',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginTop: '8px',
                            display: 'inline-block'
                        }}>
                            ✓ FREE - Included in your plan
                        </div>
                    ) : (
                        <div style={{
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginTop: '8px',
                            display: 'inline-block'
                        }}>
                            KES {t.session_rate?.toLocaleString() || '3,000'} / session
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

// Your existing TherapistAvailabilityGrid component (unchanged)
function TherapistAvailabilityGrid({ therapistId, onSlotSelect, selectedSlot }) {
    const [grid, setGrid] = useState([]);
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!therapistId) return;

        fetch(`${Api_Base}/therapist/${therapistId}/availability/`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load availability");
                return res.json();
            })
            .then((data) => {
                setGrid(data.grid);
                setDays(data.days);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error:", err);
                setLoading(false);
            });
    }, [therapistId]);

    const selectSlot = (dayIndex, dayName, time, isAvailable, isBooked) => {
        if (!isAvailable || isBooked) return;

        const today = new Date();
        const adjustedCurrentDay = (today.getDay() + 6) % 7;
        let daysAhead = dayIndex - adjustedCurrentDay;
        if (daysAhead < 0) {
            daysAhead += 7;
        }

        const selectedDate = new Date(today);
        selectedDate.setDate(today.getDate() + daysAhead);
        const formattedDate = selectedDate.toISOString().split('T')[0];

        onSlotSelect({
            day: dayIndex,
            dayName,
            date: formattedDate,
            time,
        });
    };

    if (loading) return <div className="loading">Loading schedule...</div>;

    return (
        <div className="availability-grid">
            <table>
                <thead>
                    <tr>
                        <th className="time-column">Time</th>
                        {days.map((day, index) => (
                            <th key={index}>{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {grid.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            <td className="time-column">
                                <strong>{row.time_display}</strong>
                            </td>
                            {row.slots.map((slot, colIndex) => {
                                let cellClass = "slot ";
                                let cellText = "";
                                let isClickable = false;

                                if (slot.is_booked) {
                                    cellClass += "booked";
                                    cellText = "BOOKED";
                                } else if (slot.is_available) {
                                    cellClass += "available";
                                    cellText = "Available";
                                    isClickable = true;
                                } else {
                                    cellClass += "unavailable";
                                    cellText = "Off";
                                }

                                const isSelected = selectedSlot?.day === slot.day && selectedSlot?.time === row.time;
                                if (isSelected) {
                                    cellClass += " selected-slot";
                                }

                                return (
                                    <td
                                        key={colIndex}
                                        className={cellClass}
                                        onClick={() => isClickable && selectSlot(
                                            slot.day,
                                            slot.day_name,
                                            row.time,
                                            slot.is_available,
                                            slot.is_booked
                                        )}
                                        style={{
                                            cursor: isClickable ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        {isSelected ? "✓ " : ""}{cellText}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedSlot && (
                <p style={{ color: 'green', marginTop: '10px', fontWeight: 'bold' }}>
                    ✓ Selected: {selectedSlot.dayName}, {selectedSlot.date} at {selectedSlot.time}
                </p>
            )}
        </div>
    );
}

// MAIN COMPONENT - Updated to use fair system
function Booking() {
    const navigate = useNavigate();
    
    // NEW: Patient type and organization info
    const [patientType, setPatientType] = useState(null); // 'organization' or 'independent'
    const [organizationInfo, setOrganizationInfo] = useState(null);
    const [activeCategory, setActiveCategory] = useState('my-org'); // 'my-org', 'other-org', 'independent', 'organizations'
    
    // Therapist lists by category
    const [myOrgTherapists, setMyOrgTherapists] = useState([]);
    const [otherOrgTherapists, setOtherOrgTherapists] = useState([]);
    const [independentTherapists, setIndependentTherapists] = useState([]);
    
    // Your existing states
    const [allTherapists, setAllTherapists] = useState([])
    const [filteredTherapists, setFilteredTherapists] = useState([])
    const [selectedTherapist, setSelectedTherapist] = useState(null)
    const [reasonCategory, setReasonCategory] = useState('')
    const [reasonDetails, setReasonDetails] = useState('')
    const [duration, setDuration] = useState('60')
    const [frequency, setFrequency] = useState('once')
    const [selectedSlot, setSelectedSlot] = useState(null)

    // NEW: Fetch therapists based on patient type (FAIR SYSTEM)
    useEffect(() => {
        async function fetchTherapists() {
            const token = localStorage.getItem('access_token');
            
            // If no token, fetch public therapists (backward compatible)
            if (!token) {
                try {
                    const res = await fetch(`${Api_Base}/therapists/`)
                    const data = await res.json()
                    setAllTherapists(data)
                    setFilteredTherapists(data)
                    setPatientType('public') // Public user
                } catch (err) {
                    console.log('Error fetching public therapists:', err)
                }
                return;
            }

            // Authenticated user - use fair system
            try {
                const res = await fetch(`${Api_Base}/api/available-therapists/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    // Fallback to public endpoint
                    const publicRes = await fetch(`${Api_Base}/therapists/`)
                    const publicData = await publicRes.json()
                    setAllTherapists(publicData)
                    setFilteredTherapists(publicData)
                    setPatientType('public')
                    return;
                }

                const data = await res.json();
                console.log('📋 Available therapists:', data);

                setPatientType(data.patient_type);

                if (data.patient_type === 'organization') {
                    // ORGANIZATION MEMBER - 3 categories
                    setOrganizationInfo(data.organization);
                    setMyOrgTherapists(data.my_org_therapists || []);
                    setOtherOrgTherapists(data.other_org_therapists || []);
                    setIndependentTherapists(data.independent_therapists || []);
                    
                    // Set default to my org therapists (FREE)
                    setActiveCategory('my-org');
                    setAllTherapists(data.my_org_therapists || []);
                    setFilteredTherapists(data.my_org_therapists || []);
                    
                } else if (data.patient_type === 'independent') {
                    // INDEPENDENT PATIENT - 2 categories (default to independent)
                    setIndependentTherapists(data.independent_therapists || []);
                    setOtherOrgTherapists(data.org_therapists || []); // Rename for consistency
                    
                    // Set default to independent therapists (FAIR!)
                    setActiveCategory('independent');
                    setAllTherapists(data.independent_therapists || []);
                    setFilteredTherapists(data.independent_therapists || []);
                }

            } catch (err) {
                console.log('Error fetching therapists:', err)
                // Fallback to public endpoint
                const publicRes = await fetch(`${Api_Base}/therapists/`)
                const publicData = await publicRes.json()
                setAllTherapists(publicData)
                setFilteredTherapists(publicData)
                setPatientType('public')
            }
        }
        fetchTherapists()
    }, [])

  
useEffect(() => {
    if (!reasonCategory) {
        setFilteredTherapists(allTherapists)
        return
    }

    const filtered = allTherapists.filter(t => {
        const therapistSpecialties = [
            t.specialty_1,
            t.specialty_2,
            t.specialty_3,
        ].filter(Boolean)

        return therapistSpecialties.includes(reasonCategory)
    })

    // ✅ FIX: Keep filtered therapists, but show all if no matches
    setFilteredTherapists(filtered.length > 0 ? filtered : allTherapists)

    // ✅ FIX: Only reset selection if the selected therapist is no longer in filtered list
    if (selectedTherapist && !filtered.find(th => th.id === selectedTherapist.id)) {
        setSelectedTherapist(null)
    }
}, [reasonCategory, allTherapists]) // ✅ Removed selectedTherapist from dependencies

// ✅ ADD: Reset filters when switching categories
const switchCategory = (category) => {
    setActiveCategory(category);
    
    let therapistList = [];
    if (category === 'my-org') {
        therapistList = myOrgTherapists;
    } else if (category === 'other-org') {
        therapistList = otherOrgTherapists;
    } else if (category === 'independent') {
        therapistList = independentTherapists;
    } else if (category === 'organizations') {
        therapistList = otherOrgTherapists;
    }
    
    setAllTherapists(therapistList);
    
    // ✅ FIX: Re-apply reason filter to new category
    if (reasonCategory) {
        const filtered = therapistList.filter(t => {
            const therapistSpecialties = [
                t.specialty_1,
                t.specialty_2,
                t.specialty_3,
            ].filter(Boolean)
            return therapistSpecialties.includes(reasonCategory)
        });
        setFilteredTherapists(filtered.length > 0 ? filtered : therapistList);
    } else {
        setFilteredTherapists(therapistList);
    }
    
    setSelectedTherapist(null); // Reset selection when switching
};

    // Your existing submit handler (unchanged)
    const handleSubmit = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Please login to book a session');
            navigate('/Login');
            return;
        }

        if (!selectedTherapist) {
            alert('Please select a therapist')
            return
        }
        if (!reasonCategory) {
            alert('Please select a reason for booking')
            return
        }
        if (!selectedSlot) { 
            alert('Please select a time slot')
            return
        }   

        const booking_data = {
            therapist_id: selectedTherapist.id,
            reason_category: reasonCategory,
            reason_details: reasonDetails,
            duration_minutes: parseInt(duration),
            frequency: frequency,
            date: selectedSlot.date, 
            time: selectedSlot.time,
        }
        console.log('📤 Sending booking data:', booking_data)

        try {
            const res = await fetch(`${Api_Base}/session/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(booking_data)
            })

            if (res.status === 401) {
                alert('Session expired. Please login again.');
                localStorage.clear();
                navigate('/Login');
                return;
            }

            if (res.ok) {
                const data = await res.json();
                alert('Booking Confirmed!')
                setSelectedTherapist(null)
                setReasonCategory('')
                setReasonDetails('')
                setSelectedSlot(null)
                navigate('/Dashboard');
            } else {
                const error = await res.json()
                alert(`Booking failed: ${error.error || 'You already have a session booked with this therapist'}`)
            }
        } catch (err) {
            console.error(err)
            alert('Network error. Please try again.')
        }
    }
   // Booking.jsx - Update calculateTotal function

// Price calculator
const calculateTotal = () => {
    if (!selectedTherapist) return null;

    // FREE sessions
    if (selectedTherapist.is_free) {
        return {
            total: 0,
            sessions: 1,
            pricePerSession: 0
        };
    }

    // Get the correct rate based on duration
    let baseRate;
    if (duration === '45') {
        baseRate = selectedTherapist.session_rate_45 || 2500;
    } else {
        baseRate = selectedTherapist.session_rate_60 || 3000;
    }

    const pricePerSession = baseRate;

    // Frequency → number of sessions
    const frequency_map = {
        'once': 1,
        'weekly-2': 2,
        'weekly-4': 4,
        'weekly-8': 8
    };

    const sessions = frequency_map[frequency] || 1;
    const total = pricePerSession * sessions;

    return {
        total,
        sessions,
        pricePerSession
    };
};

    return (
        <>
            <header className='bookHeader'>
                <div>
                    <img src='/logo192.png' alt='Logo' className='logo' />
                </div>
                <div className='headerWords'>
                    <h1>HeadSpace</h1>
                    <p>Book a Session with us today</p>
                </div>
            </header>

            {/* NEW: Category Tabs (only for authenticated users) */}
            {patientType === 'organization' && (
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    margin: '20px 0'
                }}>
                    <button
                        onClick={() => switchCategory('my-org')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: activeCategory === 'my-org' ? '#667eea' : 'white',
                            color: activeCategory === 'my-org' ? 'white' : '#4B5563',
                            border: '2px solid #E5E7EB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        🏢 {organizationInfo?.name} (FREE)<br/>
                        <small style={{fontSize: '12px', opacity: 0.8}}>
                            {myOrgTherapists.length} therapists
                        </small>
                    </button>
                    
                    <button
                        onClick={() => switchCategory('other-org')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: activeCategory === 'other-org' ? '#667eea' : 'white',
                            color: activeCategory === 'other-org' ? 'white' : '#4B5563',
                            border: '2px solid #E5E7EB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        🏛️ Other Organizations (PAID)<br/>
                        <small style={{fontSize: '12px', opacity: 0.8}}>
                            {otherOrgTherapists.length} therapists
                        </small>
                    </button>
                    
                    <button
                        onClick={() => switchCategory('independent')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: activeCategory === 'independent' ? '#667eea' : 'white',
                            color: activeCategory === 'independent' ? 'white' : '#4B5563',
                            border: '2px solid #E5E7EB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        ⭐ Independent (PAID)<br/>
                        <small style={{fontSize: '12px', opacity: 0.8}}>
                            {independentTherapists.length} therapists
                        </small>
                    </button>
                </div>
            )}

            {patientType === 'independent' && (
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    margin: '20px 0'
                }}>
                    <button
                        onClick={() => switchCategory('independent')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: activeCategory === 'independent' ? '#667eea' : 'white',
                            color: activeCategory === 'independent' ? 'white' : '#4B5563',
                            border: '2px solid #E5E7EB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        ⭐ Independent Therapists<br/>
                        <small style={{fontSize: '12px', opacity: 0.8}}>
                            Support independent practitioners · {independentTherapists.length} available
                        </small>
                    </button>
                    
                    <button
                        onClick={() => switchCategory('organizations')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: activeCategory === 'organizations' ? '#667eea' : 'white',
                            color: activeCategory === 'organizations' ? 'white' : '#4B5563',
                            border: '2px solid #E5E7EB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        🏛️ Organization Therapists<br/>
                        <small style={{fontSize: '12px', opacity: 0.8}}>
                            Universities & companies · {otherOrgTherapists.length} available
                        </small>
                    </button>
                </div>
            )}

            {/* Step 1: Select Reason (unchanged) */}
            <div className='therapy-form'>
                <div className='form-group'>
                    <label htmlFor="therapy_reason">What brings you to therapy?</label>
                    <select
                        id="therapy_reason"
                        name="therapy_reason"
                        value={reasonCategory}
                        onChange={(e) => setReasonCategory(e.target.value)}
                        required
                    >
                        <option value="">-- Please select an option --</option>
                        <option value="academic_pressure">Academic Pressure</option>
                        <option value="anger_management">Anger Management</option>
                        <option value="anxiety_stress">Anxiety / Stress</option>
                        <option value="burnout">Burnout / Work-related Stress</option>
                        <option value="chronic_illness">Chronic Illness or Health-related Stress</option>
                        <option value="depression">Depression</option>
                        <option value="family_problems">Family Problems</option>
                        <option value="grief_loss">Grief / Loss</option>
                        <option value="identity_issues">Identity or Self-discovery Issues</option>
                        <option value="life_transitions">Life Transitions</option>
                        <option value="parenting_issues">Parenting Challenges</option>
                        <option value="relationship_issues">Relationship Issues</option>
                        <option value="self_esteem">Self-esteem Issues</option>
                        <option value="sleep_issues">Sleep Problems / Insomnia</option>
                        <option value="social_anxiety">Social Anxiety</option>
                        <option value="substance_use">Substance Use Concerns</option>
                        <option value="trauma_ptsd">Trauma / PTSD</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className='form-group'>
                    <h2>Tell us more <span>(Optional)</span></h2>
                    <textarea
                        name='message'
                        rows='4'
                        cols='50'
                        placeholder="Share any additional details that might help us understand your needs better..."
                        value={reasonDetails}
                        onChange={(e) => setReasonDetails(e.target.value)}
                    />
                </div>
            </div>

            {/* Step 2: Select Therapist (unchanged) */}
            <div className='therapists'>
                <h2>
                    {reasonCategory
                        ? `Therapists specializing in ${reasonCategory.replace('_', ' ')}`
                        : activeCategory === 'my-org' && organizationInfo
                            ? `${organizationInfo.name} Therapists`
                            : 'Available Therapists'}
                </h2>
                {filteredTherapists.length > 0 ? (
                    <>
                        <Cards
                            onselect={setSelectedTherapist}
                            therapists={filteredTherapists}
                            selectedTherapist={selectedTherapist}
                        />
                        {selectedTherapist && (
                            <p style={{ color: 'green', fontWeight: 'bold' }}>
                                ✓ Selected: Dr. {selectedTherapist.firstName} {selectedTherapist.lastName}
                                {selectedTherapist.is_free && ' (FREE)'}
                            </p>
                        )}
                    </>
                ) : (
                    <p>No therapists available for this specialty. Please select a different reason or category.</p>
                )}
            </div>

            {/* Step 3: Session Options (unchanged) */}
            {selectedTherapist && (
                <div className='session-options'>
                    <h2>Session Options</h2>

                    <div className='form-group'>
                        <label>Session Duration:</label>
                        <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                            <option value="45">45 minutes</option>
                            <option value="60">60 minutes</option>
                        </select>
                    </div>

                    <div className='form-group'>
                        <label>Frequency:</label>
                        <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                            <option value="once">One-time session</option>
                            <option value="weekly-2">Weekly for 2 weeks (2 sessions)</option>
                            <option value="weekly-4">Weekly for 1 month (4 sessions)</option>
                            <option value="weekly-8">Weekly for 2 months (8 sessions)</option>
                        </select>
                    </div>
                </div>
            )}
            {/* NEW: Price Calculator */}
{(() => {
    const pricing = calculateTotal();
    if (!pricing) return null;

    return (
        <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '10px'
        }}>
            <h3 style={{ marginBottom: '10px' }}>💰 Session Cost</h3>

            {selectedTherapist.is_free ? (
                <p style={{ color: 'green', fontWeight: 'bold' }}>
                    ✓ This session is FREE (covered by your plan)
                </p>
            ) : (
                <>
                    <p>
                        Price per session: <strong>
                            KES {Math.round(pricing.pricePerSession).toLocaleString()}
                        </strong>
                    </p>

                    <p>
                        Number of sessions: <strong>{pricing.sessions}</strong>
                    </p>

                    <hr style={{ margin: '10px 0' }} />

                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        Total: KES {Math.round(pricing.total).toLocaleString()}
                    </p>
                </>
            )}
        </div>
    );
})()}

            {/* Step 4: Select Time (unchanged) */}
            {selectedTherapist && (
                <div>
                    <div className="availability-header">
                        <h2>
                            <FileChartLine color='#646cffaa' size={20} />
                            Dr. {selectedTherapist.firstName}'s Availability
                        </h2>
                        <div className="legend">
                            <span className="legend-item">
                                <span className="dot available"></span> Available
                            </span>
                            <span className="legend-item">
                                <span className="dot booked"></span> Booked
                            </span>
                            <span className="legend-item">
                                <span className="dot unavailable"></span> Unavailable
                            </span>
                        </div>
                    </div>

                    <TherapistAvailabilityGrid
                        therapistId={selectedTherapist.id}
                        onSlotSelect={setSelectedSlot}
                        selectedSlot={selectedSlot}
                    />
                </div>
            )}

            {/* Submit Button (unchanged) */}
            <div className='form-actions'>
                <button type='submit' onClick={handleSubmit}>Confirm Booking</button>
            </div>
        </>
    )
}

export default Booking