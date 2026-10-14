'use client';
import React from 'react';
import { cn } from '../../lib/utils';

/**
 * TwentyFirstBgMesh — 21st.dev
 *
 * Ambient layered radial gradient mesh background.
 * Subtle, non-intrusive color blobs that gently shift via CSS keyframes.
 */
export function TwentyFirstBgMesh({ className, intensity = 'subtle' }) {
  const opacityMap = { subtle: 0.35, medium: 0.55, strong: 0.75 };
  const op = opacityMap[intensity] || opacityMap.subtle;

  return (
    <div
      className={cn('pointer-events-none select-none overflow-hidden', className)}
      aria-hidden="true"
      style={{ opacity: op }}
    >
      <div
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(112, 140, 128, 0.3) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'dz-mesh-drift-1 12s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(30, 80, 56, 0.2) 0%, transparent 70%)',
          filter: 'blur(90px)',
          animation: 'dz-mesh-drift-2 14s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute top-[30%] right-[20%] w-[35%] h-[35%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(240, 245, 242, 0.5) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'dz-mesh-drift-3 10s ease-in-out infinite alternate',
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dz-mesh-drift-1 { 0% { transform: translate(0, 0); } 100% { transform: translate(30px, 20px); } }
        @keyframes dz-mesh-drift-2 { 0% { transform: translate(0, 0); } 100% { transform: translate(-25px, -15px); } }
        @keyframes dz-mesh-drift-3 { 0% { transform: translate(0, 0); } 100% { transform: translate(15px, -20px); } }
      ` }} />
    </div>
  );
}

export default TwentyFirstBgMesh;
