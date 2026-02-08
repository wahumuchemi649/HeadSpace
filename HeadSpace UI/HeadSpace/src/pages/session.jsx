import './session.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Api_Base } from './Api'
import { FileChartLine } from 'lucide-react'

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
                    <img src={`${Api_Base}/media/${t.profile_pic}`} alt={t.profile_pic} />
                    <h3>{t.firstName} {t.lastName}</h3>
                    <p>{t.specialty_1}</p>
                    <p>{t.specialty_2}</p>
                    <p>{t.specialty_3}</p>
                </div>
            ))}
        </div>
    )
}

function TherapistAvailabilityGrid({ therapistId, onSlotSelect, selectedSlot }) {
    const [grid, setGrid] = useState([]);
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!therapistId) return;

        // No auth needed - this is a public endpoint
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

    // Align JS with Python weekday (Monday = 0)
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

function Booking() {
    const navigate = useNavigate();
    const [allTherapists, setAllTherapists] = useState([])
    const [filteredTherapists, setFilteredTherapists] = useState([])
    const [selectedTherapist, setSelectedTherapist] = useState(null)
    const [reasonCategory, setReasonCategory] = useState('')
    const [reasonDetails, setReasonDetails] = useState('')
    const [duration, setDuration] = useState('60')
    const [frequency, setFrequency] = useState('once')
    const [selectedSlot, setSelectedSlot] = useState(null)

    // Fetch all therapists (public endpoint)
    useEffect(() => {
        async function fetchTherapists() {
            try {
                const res = await fetch(`${Api_Base}/therapists/`)
                const data = await res.json()
                setAllTherapists(data)
                setFilteredTherapists(data)
            } catch (err) {
                console.log(err)
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

        setFilteredTherapists(filtered.length > 0 ? filtered : allTherapists)

        if (selectedTherapist && !filtered.find(th => th.id === selectedTherapist.id)) {
            setSelectedTherapist(null)
        }
    }, [reasonCategory, allTherapists, selectedTherapist])

    const handleSubmit = async () => {
        // Check if user is logged in
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
                // Reset form
                setSelectedTherapist(null)
                setReasonCategory('')
                setReasonDetails('')
                setSelectedSlot(null)
                
                // Navigate to dashboard
                navigate('/Dashboard');
            } else {
                const error = await res.json()
                alert(`Booking failed: ${error.error || 'Unknown error'}`)
            }
        } catch (err) {
            console.error(err)
            alert('Network error. Please try again.')
        }
    }

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

            {/* Step 1: Select Reason */}
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

            {/* Step 2: Select Therapist */}
            <div className='therapists'>
                <h2>
                    {reasonCategory
                        ? `Therapists specializing in ${reasonCategory.replace('_', ' ')}`
                        : 'Our Therapists'}
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
                            </p>
                        )}
                    </>
                ) : (
                    <p>No therapists available for this specialty. Please select a different reason.</p>
                )}
            </div>

            {/* Step 3: Session Options */}
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

            {/* Step 4: Select Time from Therapist's Availability */}
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

            {/* Submit Button */}
            <div className='form-actions'>
                <button type='submit' onClick={handleSubmit}>Confirm Booking</button>
            </div>
        </>
    )
}

export default Booking