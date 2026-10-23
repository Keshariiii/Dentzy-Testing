'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from 'lucide-react';
import { getContactUrl } from '../api/client';
import { ContactCard } from './ui/contact-card';
import { ThankYouAnimation } from './ui/thank-you-animation';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

const CONTACT_API = () => getContactUrl();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    contact_number: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [hpWebsite, setHpWebsite] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = formData.user_name.trim();
    const trimmedEmail = formData.user_email.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setStatusMessage({
        type: 'error',
        text: 'Please fill in all required fields (Name, Email, Message).',
      });
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid email address (e.g. doctor@clinic.com).',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const response = await fetch(CONTACT_API(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: formData.contact_number.trim(),
          subject: formData.subject.trim(),
          message: trimmedMessage,
          hp_website: hpWebsite,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setIsSubmitted(true);
        setStatusMessage({ type: '', text: '' });
        setFormData({
          user_name: '',
          user_email: '',
          contact_number: '',
          subject: '',
          message: '',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || data.message || 'Unable to submit your message. Please try again.',
        });
      }
    } catch (error) {
      console.error('Contact submit network error:', error);
      setStatusMessage({
        type: 'error',
        text: 'Failed to connect to the server. Please check your connection and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStatusMessage({ type: '', text: '' });
  };

  return (
    <section className="py-14 sm:py-20 px-4 bg-surface-alt relative overflow-hidden" id="contact">
      <ContactCard
        title="Contact With Us"
        description="If you have questions regarding our dental laboratory cases, digital workflows, or doctor partnerships, send us a message. We respond within 1 business day."
        contactInfo={[
          {
            icon: Mail,
            label: 'Email',
            value: 'support@dentzy.in',
            href: 'mailto:support@dentzy.in',
          },
          {
            icon: Phone,
            label: 'Phone / WhatsApp',
            value: '+91 95036 68112',
            href: 'tel:+919503668112',
          },
          {
            icon: MapPin,
            label: 'Address',
            value: 'Dindayal Nagar, Vasai West - 401202, Maharashtra, India',
            className: 'sm:col-span-2',
          },
          {
            icon: Clock,
            label: 'Working Hours',
            value: 'Mon-Sat, 9 AM - 6 PM IST',
            className: 'sm:col-span-2',
          },
        ]}
      >
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="w-full space-y-3.5" noValidate={false}>
              <div className="space-y-1.5">
                <Label htmlFor="cf-name">Name *</Label>
                <Input
                  id="cf-name"
                  type="text"
                  name="user_name"
                  placeholder="Dr. Rajesh Sharma"
                  maxLength={100}
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cf-email">Email *</Label>
                  <Input
                    id="cf-email"
                    type="email"
                    name="user_email"
                    placeholder="doctor@clinic.com"
                    maxLength={100}
                    value={formData.user_email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cf-phone">Phone</Label>
                  <Input
                    id="cf-phone"
                    type="tel"
                    name="contact_number"
                    placeholder="+91 98765 43210"
                    maxLength={20}
                    value={formData.contact_number}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cf-subject">Subject</Label>
                <Input
                  id="cf-subject"
                  type="text"
                  name="subject"
                  placeholder="Zirconia Case Inquiry"
                  maxLength={200}
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cf-message">Message *</Label>
                <Textarea
                  id="cf-message"
                  name="message"
                  placeholder="Please describe your clinical case or inquiry..."
                  rows={3}
                  maxLength={15000}
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Bot Honeypot */}
              <div
                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}
                aria-hidden="true"
              >
                <input
                  type="text"
                  name="hp_website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={hpWebsite}
                  onChange={(e) => setHpWebsite(e.target.value)}
                />
              </div>

              {statusMessage.text && (
                <div
                  className={`p-3 rounded-md text-xs font-medium ${
                    statusMessage.type === 'error'
                      ? 'bg-error-bg text-error-text border border-error/20'
                      : 'bg-success-bg text-success-text border border-success/20'
                  }`}
                  role="alert"
                >
                  {statusMessage.text}
                </div>
              )}

              <Button type="submit" className="w-full gap-2 mt-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <ThankYouAnimation onReset={handleReset} />
          )}
        </AnimatePresence>
      </ContactCard>
    </section>
  );
}
