'use client';
import { useEffect } from 'react';

export default function ProductsPage() {
  useEffect(() => {
    window.location.replace('/#products');
  }, []);

  return null;
}
