import React, { useState, useCallback, useEffect, useRef } from 'react';
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



    // Honeypot state
    const [hpWebsite, setHpWebsite] = useState('');

    const sectionRef = useRef(null);



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

            } else {
                setStatusMessage({ type: 'error', text: data.error || data.message || 'Server error' });
                // Refresh CAPTCHA on invalid captcha or any error
                if (response.status === 400) {}
            }
        } catch (error) {
            console.error('FAILED...', error);
            setStatusMessage({ type: 'error', text: "Failed to connect to the server. Please try again later." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="contact-form-section" id="contact" ref={sectionRef}>
            <div className="container">
                <h2 className="contact-form-title">We Are Here To Help You</h2>

                <div className="form-bar">
                    <label htmlFor="contact-name" className="sr-only">Your name</label>
                    <input
                        id="contact-name"
                        type="text"
                        name="user_name"
                        placeholder="Name"
                        className="form-input"
                        value={formData.user_name}
                        onChange={handleChange}
                    />
                    <label htmlFor="contact-email" className="sr-only">Your email</label>
                    <input
                        id="contact-email"
                        type="email"
                        name="user_email"
                        placeholder="Email"
                        className="form-input"
                        value={formData.user_email}
                        onChange={handleChange}
                    />
                    <label htmlFor="contact-phone" className="sr-only">Phone number</label>
                    <input
                        id="contact-phone"
                        type="tel"
                        name="contact_number"
                        placeholder="Phone Number"
                        className="form-input"
                        value={formData.contact_number}
                        onChange={handleChange}
                    />
                    <label htmlFor="contact-subject" className="sr-only">Subject</label>
                    <input
                        id="contact-subject"
                        type="text"
                        name="subject"
                        placeholder="Subject"
                        className="form-input"
                        value={formData.subject}
                        onChange={handleChange}
                    />
                    <label htmlFor="contact-message" className="sr-only">Message</label>
                    <textarea
                        id="contact-message"
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
