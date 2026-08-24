import React, { useState } from 'react';
import { getContactUrl } from '../api/client';
import './ContactForm.css';

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
            const response = await fetch(getContactUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.user_name,
                    email: formData.user_email,
                    phone: formData.contact_number,
                    subject: formData.subject,
                    message: formData.message
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
                setStatusMessage({ type: 'error', text: `Failed to send message: ${data.error || 'Server error'}` });
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
                    <input
                        type="text"
                        name="message"
                        placeholder="Message"
                        className="form-input message-input"
                        value={formData.message}
                        onChange={handleChange}
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
