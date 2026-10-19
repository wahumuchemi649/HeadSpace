# patients/utils.py - CORRECTED

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

def send_booking_confirmation_email(data):  # ✅ Changed parameter name from email_data to data
    """Send booking confirmation email"""
    
    try:
        # Extract data
        is_free = data.get('is_free', False)
        session_cost = data.get('session_cost', 0)
        organization_name = data.get('organization_name')
        patient_email = data.get('patient_email')
        patient_name = data.get('patient_name')
        therapist_name = data.get('therapist_name')
        therapist_specialty = data.get('therapist_specialty', 'General Therapy')
        session_date = data.get('session_date')
        session_time = data.get('session_time')
        duration_minutes = data.get('duration_minutes', 60)
        booking_reference = data.get('booking_reference')
        reason_category = data.get('reason_category', '')
        
        # Format reason
        reason_display = reason_category.replace('_', ' ').title()
        
        # Email subject
        subject = f"✅ Session Confirmed with {therapist_name}"
        
        # Compose HTML email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                }}
                .header {{
                    background: linear-gradient(135deg, #3d1d77 0%, #61dafb 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: #f9fafb;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                }}
                .session-card {{
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    border-left: 4px solid #3d1d77;
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                }}
                .free-badge {{
                    background: #DEF7EC;
                    color: #03543F;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                }}
                .paid-badge {{
                    background: #FEF3C7;
                    color: #92400E;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #888;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>✅ Session Confirmed!</h1>
                <p>Your therapy session has been successfully booked</p>
            </div>
            
            <div class="content">
                <p>Dear {patient_name},</p>
                
                <p>Your therapy session has been confirmed! We're looking forward to supporting you.</p>
                
                <div class="session-card">
                    <h2>📋 Session Details</h2>
                    
                    <div class="detail-row">
                        <span><strong>Therapist:</strong></span>
                        <span>{therapist_name}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Specialty:</strong></span>
                        <span>{therapist_specialty}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Date:</strong></span>
                        <span>{session_date}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Time:</strong></span>
                        <span>{session_time}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Duration:</strong></span>
                        <span>{duration_minutes} minutes</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Reason:</strong></span>
                        <span>{reason_display}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Reference:</strong></span>
                        <span><strong>{booking_reference}</strong></span>
                    </div>
                    
                    <div class="detail-row">
                        <span><strong>Cost:</strong></span>
                        <span>
                            {'<span class="free-badge">FREE - Covered by ' + organization_name + '</span>' if is_free else '<span class="paid-badge">KES ' + f'{session_cost:,.0f}' + '</span>'}
                        </span>
                    </div>
                </div>
                
                <p><strong>What to expect:</strong></p>
                <ul>
                    <li>Join 5 minutes early</li>
                    <li>Find a quiet, private space</li>
                    <li>Have a stable internet connection</li>
                </ul>
                
                {'<p><strong>Payment:</strong> Amount due KES ' + f'{session_cost:,.0f}' + '. Our team will contact you with payment details.</p>' if not is_free else ''}
            </div>
            
            <div class="footer">
                <p><strong>HeadSpace Mental Health Platform</strong></p>
                <p>Need help? Contact us at support@headspace.com</p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
Session Confirmed!

Dear {patient_name},

Your therapy session has been confirmed!

SESSION DETAILS:
Therapist: {therapist_name}
Specialty: {therapist_specialty}
Date: {session_date}
Time: {session_time}
Duration: {duration_minutes} minutes
Reason: {reason_display}
Reference: {booking_reference}
Cost: {'FREE - Covered by ' + organization_name if is_free else 'KES ' + f'{session_cost:,.0f}'}

{'Payment: Amount due KES ' + f'{session_cost:,.0f}' if not is_free else ''}

Best regards,
HeadSpace Team
        """
        
        # Create email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[patient_email]
        )
        
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
        print(f"✅ Booking confirmation email sent to {patient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send booking confirmation email: {e}")
        import traceback
        traceback.print_exc()
        return False