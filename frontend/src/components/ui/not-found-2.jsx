'use client';

// ponytail: 21st.dev not-found-2 component with bottom-fade mask and Dentzy brand tokens
import React from 'react';
import Link from 'next/link';
import { HomeIcon, CompassIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

// Safe link that works seamlessly with both Next.js href and React Router to props
const SafeLink = ({ to, href = '/', children, ...props }) => {
  return (
    <Link href={to || href} {...props}>
      {children}
    </Link>
  );
};

export default function NotFound2() {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4"
      style={{
        backgroundColor: 'var(--background)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Background subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(112, 140, 128, 0.2) 0%, transparent 70%)',
        }}
      />

      <Empty className="relative z-10 w-full max-w-md py-12">
        <EmptyHeader className="w-full flex flex-col items-center">
          {/* Giant 404 with Bottom Fade Gradient Mask */}
          <EmptyTitle
            className="font-extrabold select-none tracking-tighter"
            style={{
              fontSize: 'clamp(6rem, 15vw, 9rem)',
              lineHeight: 1,
              color: 'var(--primary)',
              maskImage:
                'linear-gradient(to bottom, rgba(30,80,56,1) 20%, rgba(112,140,128,0.15) 85%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(30,80,56,1) 20%, rgba(112,140,128,0.15) 85%)',
            }}
          >
            404
          </EmptyTitle>

          {/* Description */}
          <EmptyDescription
            className="-mt-6 text-center text-sm md:text-base font-normal"
            style={{ color: 'var(--muted-foreground)', maxWidth: '340px' }}
          >
            The page you're looking for might have been moved or doesn't exist.
          </EmptyDescription>
        </EmptyHeader>

        {/* Action Buttons */}
        <EmptyContent className="flex flex-wrap items-center justify-center gap-3 mt-4 w-full">
          {/* Go Home Button */}
          <Button
            asChild
            className="rounded-lg font-semibold px-5 min-h-[44px] shadow-xs"
            style={{
              backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)',
            }}
          >
            <SafeLink href="/" to="/">
              <HomeIcon className="size-4 mr-2" />
              Go Home
            </SafeLink>
          </Button>

          {/* Explore / Portal Button */}
          <Button
            asChild
            variant="outline"
            className="rounded-lg font-semibold px-5 min-h-[44px]"
            style={{
              border: '1.5px solid #708c80',
              color: 'var(--primary)',
              backgroundColor: '#ffffff',
            }}
          >
            <SafeLink href="/login" to="/login">
              <CompassIcon className="size-4 mr-2" />
              Explore Portal
            </SafeLink>
          </Button>
        </EmptyContent>

        {/* Reassuring Footer */}
        <div className="mt-8 text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
          <span>Need immediate assistance? </span>
          <a
            href="tel:+919503668112"
            className="font-medium hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Call Lab Support: +91 95036 68112
          </a>
        </div>
      </Empty>
    </div>
  );
}
