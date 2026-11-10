'use client';
import { useEffect } from 'react';

export default function AboutPage() {
  useEffect(() => {
    window.location.replace('/#about');
  }, []);

  return null;
}
