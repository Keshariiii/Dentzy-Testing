'use client';
import { useEffect } from 'react';

export default function AboutUsPage() {
  useEffect(() => {
    window.location.replace('/#about');
  }, []);

  return null;
}
