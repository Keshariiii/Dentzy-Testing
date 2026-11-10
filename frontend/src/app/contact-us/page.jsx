'use client';
import { useEffect } from 'react';

export default function ContactUsPage() {
  useEffect(() => {
    window.location.replace('/#contact');
  }, []);

  return null;
}
