'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DockItem {
  id: string;
  name: string;
  icon?: string;
  IconComponent?: React.ComponentType<{ className?: string; size?: number; width?: number; height?: number }>;
  href?: string;
  onClick?: () => void;
}

export interface MacOSDockProps {
  items: DockItem[];
  onItemClick?: (id: string) => void;
  className?: string;
  baseSize?: number;
}

export const MacOSDock: React.FC<MacOSDockProps> = ({
  items,
  onItemClick,
  className = '',
  baseSize,
}) => {
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [currentScales, setCurrentScales] = useState<number[]>(() => (items || []).map(() => 1));
  const [currentPositions, setCurrentPositions] = useState<number[]>([]);
  const dockRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastMouseMoveTime = useRef<number>(0);

  // Responsive size calculations
  const getResponsiveConfig = useCallback(() => {
    if (typeof window === 'undefined') {
      return { baseIconSize: baseSize || 40, maxScale: 1.45, effectWidth: 200 };
    }

    const smallerDimension = Math.min(window.innerWidth, window.innerHeight);

    if (smallerDimension < 480) {
      return {
        baseIconSize: baseSize ? Math.min(baseSize, 36) : 34,
        maxScale: 1.25,
        effectWidth: 150,
      };
    } else if (smallerDimension < 768) {
      return {
        baseIconSize: baseSize ? Math.min(baseSize, 38) : 36,
        maxScale: 1.35,
        effectWidth: 180,
      };
    } else {
      return {
        baseIconSize: baseSize || 40,
        maxScale: 1.45,
        effectWidth: 210,
      };
    }
  }, [baseSize]);

  const [config, setConfig] = useState(getResponsiveConfig);
  const { baseIconSize, maxScale, effectWidth } = config;
  const minScale = 1.0;
  const baseSpacing = Math.max(6, baseIconSize * 0.16);

  useEffect(() => {
    const handleResize = () => setConfig(getResponsiveConfig());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveConfig]);

  // Authentic macOS cosine magnification algorithm
  const calculateTargetMagnification = useCallback(
    (mousePosition: number | null) => {
      if (mousePosition === null || !items) {
        return (items || []).map(() => minScale);
      }

      return items.map((_, index) => {
        const normalIconCenter = index * (baseIconSize + baseSpacing) + baseIconSize / 2;
        const minX = mousePosition - effectWidth / 2;
        const maxX = mousePosition + effectWidth / 2;

        if (normalIconCenter < minX || normalIconCenter > maxX) {
          return minScale;
        }

        const theta = ((normalIconCenter - minX) / effectWidth) * 2 * Math.PI;
        const cappedTheta = Math.min(Math.max(theta, 0), 2 * Math.PI);
        const scaleFactor = (1 - Math.cos(cappedTheta)) / 2;

        return minScale + scaleFactor * (maxScale - minScale);
      });
    },
    [items, baseIconSize, baseSpacing, effectWidth, maxScale, minScale]
  );

  const calculatePositions = useCallback(
    (scales: number[]) => {
      let currentX = 0;
      return scales.map((scale) => {
        const scaledWidth = baseIconSize * scale;
        const centerX = currentX + scaledWidth / 2;
        currentX += scaledWidth + baseSpacing;
        return centerX;
      });
    },
    [baseIconSize, baseSpacing]
  );

  useEffect(() => {
    if (!items || items.length === 0) return;
    const initialScales = items.map(() => minScale);
    const initialPositions = calculatePositions(initialScales);
    setCurrentScales(initialScales);
    setCurrentPositions(initialPositions);
  }, [items, calculatePositions, minScale, config]);

  // Smooth lerp animation loop
  const animateToTarget = useCallback(() => {
    if (!items || items.length === 0) return;
    const targetScales = calculateTargetMagnification(mouseX);
    const targetPositions = calculatePositions(targetScales);
    const lerpFactor = mouseX !== null ? 0.22 : 0.14;

    setCurrentScales((prevScales) =>
      prevScales.map((currentScale, index) => {
        const diff = (targetScales[index] || minScale) - currentScale;
        return currentScale + diff * lerpFactor;
      })
    );

    setCurrentPositions((prevPositions) =>
      prevPositions.map((currentPos, index) => {
        const diff = (targetPositions[index] || 0) - currentPos;
        return currentPos + diff * lerpFactor;
      })
    );

    const scalesNeedUpdate = currentScales.some(
      (scale, index) => Math.abs(scale - (targetScales[index] || minScale)) > 0.002
    );
    const positionsNeedUpdate = currentPositions.some(
      (pos, index) => Math.abs(pos - (targetPositions[index] || 0)) > 0.1
    );

    if (scalesNeedUpdate || positionsNeedUpdate || mouseX !== null) {
      animationFrameRef.current = requestAnimationFrame(animateToTarget);
    }
  }, [mouseX, calculateTargetMagnification, calculatePositions, currentScales, currentPositions, items, minScale]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animateToTarget);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animateToTarget]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
        return;
      }

      const now = performance.now();
      if (now - lastMouseMoveTime.current < 14) return;
      lastMouseMoveTime.current = now;

      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        const pad = Math.max(8, baseIconSize * 0.15);
        setMouseX(e.clientX - rect.left - pad);
      }
    },
    [baseIconSize]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseX(null);
  }, []);

  const createBounceAnimation = (element: HTMLElement) => {
    const bounceHeight = Math.max(-8, -baseIconSize * 0.18);
    element.style.transition = 'transform 0.18s ease-out';
    element.style.transform = `translateY(${bounceHeight}px)`;

    setTimeout(() => {
      element.style.transform = 'translateY(0px)';
    }, 180);
  };

  const handleClick = (item: DockItem, index: number) => {
    if (iconRefs.current[index]) {
      createBounceAnimation(iconRefs.current[index]!);
    }
    if (item.onClick) item.onClick();
    if (onItemClick) onItemClick(item.id);
  };

  if (!items || items.length === 0) return null;

  const contentWidth =
    currentPositions.length > 0
      ? Math.max(
          ...currentPositions.map((pos, index) => pos + (baseIconSize * (currentScales[index] || 1)) / 2)
        )
      : items.length * (baseIconSize + baseSpacing) - baseSpacing;

  const padding = Math.max(8, baseIconSize * 0.16);

  return (
    <div
      ref={dockRef}
      className={cn('inline-flex items-center backdrop-blur-md transition-all select-none', className)}
      style={{
        width: `${Math.ceil(contentWidth + padding * 2)}px`,
        maxWidth: '100%',
        background: 'rgba(26, 38, 33, 0.65)',
        borderRadius: `${Math.max(14, baseIconSize * 0.45)}px`,
        border: '1px solid rgba(163, 191, 177, 0.2)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        padding: `${padding}px`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        style={{
          height: `${baseIconSize * maxScale}px`,
          width: '100%',
        }}
      >
        {items.map((item, index) => {
          const scale = currentScales[index] || 1;
          const position = currentPositions[index] || 0;
          const scaledSize = baseIconSize * scale;
          const IconComp = item.IconComponent;

          const innerBadge = (
            <div
              ref={(el) => {
                iconRefs.current[index] = el;
              }}
              className="absolute cursor-pointer flex flex-col items-center justify-center rounded-full border border-[rgba(163,191,177,0.3)] bg-[rgba(255,255,255,0.05)] text-[#a3bfb1] hover:bg-[#708c80] hover:text-[#1e2824] hover:border-[#708c80] transition-colors shadow-xs"
              title={item.name}
              onClick={() => handleClick(item, index)}
              style={{
                left: `${position - scaledSize / 2}px`,
                bottom: '0px',
                width: `${scaledSize}px`,
                height: `${scaledSize}px`,
                transformOrigin: 'bottom center',
                zIndex: Math.round(scale * 10),
              }}
            >
              {item.icon ? (
                <img
                  src={item.icon}
                  alt={item.name}
                  width={scaledSize * 0.55}
                  height={scaledSize * 0.55}
                  className="object-contain pointer-events-none"
                />
              ) : IconComp ? (
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }} className="flex items-center justify-center pointer-events-none">
                  <IconComp />
                </div>
              ) : null}
            </div>
          );

          if (item.href) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.name}
                className="no-underline text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              >
                {innerBadge}
              </a>
            );
          }

          return <React.Fragment key={item.id}>{innerBadge}</React.Fragment>;
        })}
      </div>
    </div>
  );
};

export default MacOSDock;
