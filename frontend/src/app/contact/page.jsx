'use client';
import { useEffect } from 'react';

export default function ContactPage() {
  useEffect(() => {
    window.location.replace('/#contact');
  }, []);

  return null;
}
