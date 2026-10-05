'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigationStore, NAVIGATION_ITEMS } from '@/stores/useNavigationStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { tacticalAudio } from '@/lib/audio';
import { User, BookOpen, Map, ChevronRight, Shield, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

const ANGLE_STEP = 45;

export const TacticalWheel: React.FC = () => {
  const { activeIndex, isCollapsed, selectIndex, collapseWheel, expandWheel } = useNavigationStore();
  const { dict } = useLocaleStore();
  const { user } = useAuthStore();

  const visibleItems = React.useMemo(() => {
    return user?.role === 'admin'
      ? NAVIGATION_ITEMS
      : NAVIGATION_ITEMS.filter((item) => item.id !== 'admin');
  }, [user?.role]);

  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  // PONYTAIL PROXIMITY FADE
  // We use JS because CSS can't know cursor distance without blocking clicks underneath.
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (!isCollapsed) {
      // Reset inline styles when expanded
      if (triggerRef.current) {
        triggerRef.current.style.opacity = '';
        triggerRef.current.style.pointerEvents = '';
        triggerRef.current.style.transform = '';
      }
      return;
    }
    
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!triggerRef.current) return;
        
        // Target coordinates (mid-left screen)
        const triggerX = 0;
        const triggerY = window.innerHeight / 2;
        
        const dx = e.clientX - triggerX;
        const dy = e.clientY - triggerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const maxDist = 250;
        const minDist = 50;
        
        if (dist > maxDist) {
          triggerRef.current.style.opacity = '0.05';
          triggerRef.current.style.pointerEvents = 'none';
          triggerRef.current.style.transform = 'translate(-40%, -50%) scale(0.8)';
        } else {
          const progress = 1 - (dist - minDist) / (maxDist - minDist);
          const clamped = Math.max(0.05, Math.min(1, progress));
          triggerRef.current.style.opacity = clamped.toString();
          
          if (dist < 90) {
             triggerRef.current.style.pointerEvents = 'auto';
             triggerRef.current.style.transform = `translate(-20%, -50%) scale(${0.8 + 0.2 * clamped})`;
          } else {
             triggerRef.current.style.pointerEvents = 'none';
             triggerRef.current.style.transform = 'translate(-40%, -50%) scale(0.8)';
          }
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isCollapsed]);


  // Remove physics hooks, use standard React rendering + CSS transition for wheel rotation
  
  // Handle Click/Touch Outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) ? e.touches[0]?.target : (e as MouseEvent).target;
      if (!isCollapsed && stageRef.current && !stageRef.current.contains(target as Node)) {
        collapseWheel();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isCollapsed, collapseWheel]);

  // Handle Touch Swipe: right-edge swipe opens, up/down navigates when open
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      // Swipe right from left edge (within 60px) => open
      if (isCollapsed && touchStartX < 60 && dx > 50 && Math.abs(dy) < Math.abs(dx)) {
        expandWheel();
        tacticalAudio.playWheelToggle(true);
        return;
      }

      // Swipe left when open => close
      if (!isCollapsed && dx < -60 && Math.abs(dy) < Math.abs(dx)) {
        collapseWheel();
        tacticalAudio.playSelect();
        return;
      }

      // Swipe up/down when open => navigate
      if (!isCollapsed && Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) {
        const delta = dy > 0 ? -1 : 1;
        selectIndex(activeIndex + delta);
        tacticalAudio.playHover();
      }
    };

    // Block page scroll while wheel is open (must be non-passive to allow preventDefault)
    const onTouchMove = (e: TouchEvent) => {
      if (!isCollapsed) e.preventDefault();
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isCollapsed, activeIndex, expandWheel, collapseWheel, selectIndex]);

  // Handle Wheel Scroll
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    const handleWheel = (e: WheelEvent) => {
      if (isCollapsed || timeout) return;
      const delta = Math.sign(e.deltaY);
      if (delta !== 0) {
        const next = Math.max(0, Math.min(NAVIGATION_ITEMS.length - 1, activeIndex + delta));
        if (next !== activeIndex) {
          selectIndex(next);
          tacticalAudio.playHover();
        }
      }
      timeout = setTimeout(() => {
        timeout = null;
      }, 120);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeIndex, isCollapsed, selectIndex]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || (e.target instanceof Element && e.target.closest('[data-testid="tactical-map"]'))) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (isCollapsed) {
        if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) {
          expandWheel();
          tacticalAudio.playWheelToggle(true);
        }
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        selectIndex(activeIndex + 1);
        tacticalAudio.playHover();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        selectIndex(activeIndex - 1);
        tacticalAudio.playHover();
      } else if (e.key === 'Enter') {
        tacticalAudio.playSelect();
        if (hoveredIndex !== -1 && hoveredIndex !== activeIndex) {
          selectIndex(hoveredIndex);
        }
        collapseWheel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, isCollapsed, selectIndex, expandWheel, collapseWheel, hoveredIndex]);

  const handleNodeClick = useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    selectIndex(idx);
    tacticalAudio.playSelect();
    collapseWheel();
  }, [selectIndex, collapseWheel]);

  const handleTriggerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    expandWheel();
    tacticalAudio.playWheelToggle(true);
  }, [expandWheel]);

  return (
    <>
      {/* Re-opening Trigger Button (visible when collapsed) */}
      <button
        type="button"
        aria-label={dict.navigation.open_nav}
        title={dict.navigation.open_nav}
        ref={triggerRef}
        className={`wheel-trigger-btn ${isCollapsed ? 'wheel-trigger-btn-visible' : ''}`}
        onClick={handleTriggerClick}
        onMouseEnter={handleTriggerClick}
      >
        <div className="wheel-trigger-ring" />
        <ChevronRight size={22} />
      </button>

      {/* Orbital Stage (visible when expanded) */}
      <div 
        ref={stageRef}
        className={`wheel-stage ${isCollapsed ? 'wheel-stage-collapsed' : ''}`}
      >
        <div className="wheel-ambient-glow" />
        <div className="wheel-orbital-ring" />
        <div className="wheel-orbital-inner" />
        <div className="wheel-orbital-dot" />

        <div 
          className="wheel-pivot"
          style={{
            transform: `rotate(${-(activeIndex * ANGLE_STEP)}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {visibleItems.map((item, idx) => {
            const isSelected = item.index === activeIndex;
            
            // Calculate hover offset and opacity manually
            let targetRadialOffset = 0;
            if (hoveredIndex !== -1 && !isCollapsed) {
              const dist = Math.abs(idx - hoveredIndex);
              if (dist === 0) targetRadialOffset = 16;
              else if (dist === 1) targetRadialOffset = 5;
            }
            
            const rawOffset = (idx - activeIndex);
            const absOffset = Math.abs(rawOffset);
            
            const opacityMap: Record<number, number> = { 0: 1.0, 1: 0.55, 2: 0.28 };
            let opacity = 0.2;
            if (absOffset <= 0) opacity = opacityMap[0];
            else if (absOffset >= 2) opacity = opacityMap[2];
            else {
              const floor = Math.floor(absOffset);
              const ceil = Math.ceil(absOffset);
              const ratio = absOffset - floor;
              const opFloor = opacityMap[floor] ?? 0.2;
              const opCeil = opacityMap[ceil] ?? 0.2;
              opacity = Math.max(0.2, opFloor + (opCeil - opFloor) * ratio);
            }

            return (
              <div
                key={item.id}
                className={`wheel-item-node ${isSelected ? 'is-active' : ''}`}
                style={{
                  transform: `rotate(${idx * ANGLE_STEP}deg) translate3d(${targetRadialOffset}px, 0, 0)`,
                  transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease',
                  opacity,
                  zIndex: isSelected ? 40 : hoveredIndex === idx ? 30 : (20 - Math.round(absOffset))
                }}
                onMouseEnter={() => {
                  if (!isCollapsed) {
                    setHoveredIndex(idx);
                    tacticalAudio.playHover();
                  }
                }}
                onMouseLeave={() => setHoveredIndex(-1)}
                onClick={(e) => handleNodeClick(item.index, e)}
              >
                <button
                  type="button"
                  className="wheel-btn"
                  aria-label={dict.navigation[item.id as keyof typeof dict.navigation]}
                >
                  <div className="wheel-tab-indicator" />
                  
                  <div className="wheel-tab-icon">
                    {item.icon === 'user' && <User size={18} />}
                    {item.icon === 'book' && <BookOpen size={18} />}
                    {item.icon === 'map' && <Map size={18} />}
                    {item.icon === 'admin' && <Shield size={18} />}
                    {item.icon === 'shop' && <ShoppingCart size={18} />}
                  </div>

                  <div className="wheel-tab-info">
                    <span className="wheel-tab-code">
                      {dict.navigation[`${item.id}_sec` as keyof typeof dict.navigation]}
                    </span>
                    <span className="wheel-tab-label">
                      {dict.navigation[item.id as keyof typeof dict.navigation]}
                    </span>
                  </div>

                  <span className="wheel-tab-badge">{item.code}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
