'use client';

import React, { useEffect } from 'react';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCompendiumStore } from '@/stores/useCompendiumStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { TacticalTopBar } from './TacticalTopBar';
import { TacticalWheel } from '../navigation/TacticalWheel';
import { CharactersView } from '../views/CharactersView';
import { GrimoireView } from '../views/GrimoireView';
import { TacticalMapView } from '../views/TacticalMapView';
import { AdminView } from '../admin/AdminView';
import { ShopView } from '../views/ShopView';
import { TacticalLockScreen } from '../auth/TacticalLockScreen';
import { TacticalUserBadge } from '../auth/TacticalUserBadge';
import { TacticalLoader } from '../ui/TacticalLoader';
import { InternalLoader } from '../ui/InternalLoader';

export const TacticalAppShell: React.FC = () => {
  const { activeView, selectView } = useNavigationStore();
  const { user, hasCheckedSession, checkSession } = useAuthStore();
  const { fetchCompendium } = useCompendiumStore();
  const { backgroundImage } = useConfigStore();
  const [showLoader, setShowLoader] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    checkSession();
    fetchCompendium();
    setMounted(true);
  }, [checkSession, fetchCompendium]);

  // Protect Admin view from non-admins
  useEffect(() => {
    if (user && user.role !== 'admin' && activeView === 'admin') {
      selectView('grimoire');
    }
  }, [user, activeView, selectView]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--surface-bg)',
      }}
    >
      {/* Background Image Layer */}
      {mounted && backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />
      )}

      {/* Glassmorphism Overlay to darken and blur the background */}
      {mounted && backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(8, 8, 12, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 0,
          }}
        />
      )}
      {/* Main View Area - Only render if authenticated and loader is gone */}
      {user && !showLoader && (
        <>
          {/* User Badge with Logout */}
          <TacticalUserBadge />

          <main style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
            <div key={activeView} className="view-enter" style={{ width: '100%', height: '100%' }}>
              {activeView === 'characters' && <CharactersView />}
              {activeView === 'grimoire' && <GrimoireView />}
              {activeView === 'map' && <TacticalMapView />}
              {activeView === 'shop' && <ShopView />}
              {activeView === 'admin' && user?.role === 'admin' && <AdminView />}
            </div>
          </main>

          {/* Radial Orbital Wheel Navigation */}
          <TacticalWheel />
        </>
      )}

      {/* Mandatory Lock Screen if not authenticated (mounts ONLY after loader finishes) */}
      {hasCheckedSession && !user && !showLoader && <TacticalLockScreen />}
      
      {/* Cinematic Loading state */}
      {showLoader && (
        <TacticalLoader 
          isFinished={hasCheckedSession} 
          onComplete={() => setShowLoader(false)} 
        />
      )}
    </div>
  );
};
