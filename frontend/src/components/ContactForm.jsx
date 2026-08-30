import React, { useState, useCallback, useEffect } from 'react';
import { getContactUrl } from '../api/client';
import './ContactForm.css';

const CONTACT_API = () => getContactUrl();

const ContactForm = () => {

    const [formData, setFormData] = useState({
        user_name: '',
        user_email: '',
        contact_number: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    // CAPTCHA state
    const [captchaInput, setCaptchaInput] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [captchaLoading, setCaptchaLoading] = useState(false);

    // Honeypot state
    const [hpWebsite, setHpWebsite] = useState('');

    const fetchCaptcha = useCallback(async () => {
        setCaptchaLoading(true);
        setCaptchaInput('');
        try {
            const res = await fetch(`${CONTACT_API()}/captcha`);
            const data = await res.json();
            if (res.ok) {
                setCaptchaToken(data.captchaToken);
                setCaptchaSvg(data.captchaSvg);
            }
        } catch { /* silently ignore */ }
        setCaptchaLoading(false);
    }, []);

    // Load CAPTCHA on first render
    useEffect(() => {
        fetchCaptcha();
    }, [fetchCaptcha]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // VALIDATION: Basic check
        if (!formData.user_name || !formData.user_email || !formData.message) {
            setStatusMessage({ type: 'error', text: "Please fill in all required fields (Name, Email, Message)" });
            return;
        }

        if (!captchaInput.trim()) {
            setStatusMessage({ type: 'error', text: "Please enter the CAPTCHA code shown in the image." });
            return;
        }

        setIsSubmitting(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await fetch(CONTACT_API(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.user_name,
                    email: formData.user_email,
                    phone: formData.contact_number,
                    subject: formData.subject,
                    message: formData.message,
                    captchaInput,
                    captchaToken,
                    hp_website: hpWebsite,
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatusMessage({ type: 'success', text: "Message Sent Successfully!" });
                setFormData({
                    user_name: '',
                    user_email: '',
                    contact_number: '',
                    subject: '',
                    message: ''
                });
                fetchCaptcha();
            } else {
                setStatusMessage({ type: 'error', text: data.error || data.message || 'Server error' });
                // Refresh CAPTCHA on invalid captcha or any error
                if (data.invalidCaptcha || response.status === 400) fetchCaptcha();
            }
        } catch (error) {
            console.error('FAILED...', error);
            setStatusMessage({ type: 'error', text: "Failed to connect to the server. Please try again later." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="contact-form-section" id="contact">
            <div className="container">
                <h2 className="contact-form-title">We Are Here To Help You</h2>

                <div className="form-bar">
                    <input
                        type="text"
                        name="user_name"
                        placeholder="Name"
                        className="form-input"
                        value={formData.user_name}
                        onChange={handleChange}
                    />
                    <input
                        type="email"
                        name="user_email"
                        placeholder="Email"
                        className="form-input"
                        value={formData.user_email}
                        onChange={handleChange}
                    />
                    <input
                        type="tel"
                        name="contact_number"
                        placeholder="Phone Number"
                        className="form-input"
                        value={formData.contact_number}
                        onChange={handleChange}
                    />
                    <input
                        type="text"
                        name="subject"
                        placeholder="Subject"
                        className="form-input"
                        value={formData.subject}
                        onChange={handleChange}
                    />
                    <textarea
                        name="message"
                        placeholder="Message"
                        className="form-input message-input"
                        value={formData.message}
                        onChange={handleChange}
                        rows={1}
                    />
                </div>

                {/* Honeypot — hidden from real users, bots fill it */}
                <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                    <input
                        type="text"
                        name="hp_website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={hpWebsite}
                        onChange={(e) => setHpWebsite(e.target.value)}
                    />
                </div>

                {/* CAPTCHA */}
                <div className="contact-captcha-container">
                    <div className="contact-captcha-box">
                        <div className="contact-captcha-svg-wrap">
                            {captchaSvg
                                ? <div dangerouslySetInnerHTML={{ __html: captchaSvg }} style={{ width: '100%' }} />
                                : (
                                    <div className="contact-captcha-placeholder">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#708c80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-captcha-spin">
                                            <line x1="12" y1="2" x2="12" y2="6"/>
                                            <line x1="12" y1="18" x2="12" y2="22"/>
                                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                                            <line x1="2" y1="12" x2="6" y2="12"/>
                                            <line x1="18" y1="12" x2="22" y2="12"/>
                                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                                        </svg>
                                    </div>
                                )
                            }
                        </div>
                        <button
                            type="button"
                            className="contact-captcha-refresh-btn"
                            onClick={fetchCaptcha}
                            disabled={captchaLoading}
                            title="Get a new CAPTCHA"
                            aria-label="Refresh CAPTCHA"
                        >
                            <svg
                                width="17" height="17"
                                viewBox="0 0 24 24"
                                fill="none" stroke="currentColor"
                                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                                className={captchaLoading ? 'contact-captcha-spin' : ''}
                            >
                                <polyline points="23 4 23 10 17 10"/>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                        </button>
                    </div>
                    <input
                        id="contact-captcha"
                        type="text"
                        className="contact-captcha-input"
                        placeholder="Enter CAPTCHA code"
                        value={captchaInput}
                        onChange={e => { setCaptchaInput(e.target.value); setStatusMessage({ type: '', text: '' }); }}
                        autoComplete="off"
                        maxLength={6}
                        spellCheck={false}
                    />
                </div>

                <div className="contact-info-row">
                    <div className="info-item">
                        <h3>Address:</h3>
                        <p>[Vasai -Palghar 401202]</p>
                    </div>
                    <div className="info-item">
                        <h3>Phone:</h3>
                        <p>+91- 9503668112</p>
                    </div>
                    <div className="info-item">
                        <h3>Email:</h3>
                        <p>dentzyemail@gmail.com</p>
                    </div>
                    <div className="info-item">
                        <h3>Working Hours:</h3>
                        <p>Mon-Fri, 9 AM-6 PM</p>
                    </div>
                    <div className="action-item">
                        <button 
                            className="send-msg-btn" 
                            onClick={handleSubmit} 
                            disabled={isSubmitting}
                            style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                        >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                        {statusMessage.text && (
                            <p style={{ marginTop: '10px', color: statusMessage.type === 'error' ? 'red' : 'green', fontWeight: 'bold' }}>
                                {statusMessage.text}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ContactForm;
