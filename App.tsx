import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { Page, UserProfile, CancerType, CancerStage } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { db } from './services/db';
import { LogoIcon } from './components/Icons';

// Lazy-load page components for better performance and code-splitting.
const SplashScreen = lazy(() => import('./components/SplashScreen'));
const TermsScreen = lazy(() => import('./components/TermsScreen'));
const OnboardingScreen = lazy(() => import('./components/OnboardingScreen'));
const AuthScreen = lazy(() => import('./components/AuthScreen'));
const Dashboard = lazy(() => import('./components/Dashboard'));
// Dedicated, self-contained portal for guest users (never mounts Dashboard).
const GuestPortal = lazy(() => import('./components/GuestPortal'));

// A loading component to show while pages are being loaded.
const LoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-transparent">
    <LogoIcon className="w-16 h-16 text-emerald-600 animate-spin" />
    <p className="mt-4 text-emerald-800 dark:text-emerald-300">Loading...</p>
  </div>
);

const App: React.FC = () => {
  // Start with a null page to indicate loading, preventing a flash of the splash screen
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authInitialView, setAuthInitialView] = useState<'initial' | 'signIn'>('initial');

  // Check for existing session on startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const profile = await db.getSession();
        if (profile) {
          // Restored sessions are always real users — never guests
          setUserProfile(profile);
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('splash'); // No session, start with splash
        }
      } catch (error) {
        console.error('Session check failed', error);
        setCurrentPage('splash'); // On error, default to splash
      }
    };
    checkSession();
  }, []);

  const handleAuthSuccess = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    // Route guests to their isolated portal; real users to the full dashboard
    setCurrentPage(profile.isGuest ? 'guest' : 'dashboard');
  }, []);

  const handleLogout = useCallback(async () => {
    await db.signOut();
    setUserProfile(null);
    setAuthInitialView('signIn'); // Direct returning users to Sign In
    setCurrentPage('auth');
  }, []);

  // Called when a guest taps "Sign Up" — clear guest state and go to auth
  const handleGuestSignUp = useCallback(() => {
    setUserProfile(null);
    setAuthInitialView('initial');
    setCurrentPage('auth');
  }, []);

  const renderPage = () => {
    // While checking session initially (currentPage is null), show loading fallback
    if (currentPage === null) {
      return <LoadingFallback />;
    }

    switch (currentPage) {
      case 'splash':
        return <SplashScreen onGetStarted={() => setCurrentPage('terms')} />;

      case 'terms':
        return (
          <TermsScreen
            onAgree={() => setCurrentPage('onboarding')}
            onBack={() => setCurrentPage('splash')}
          />
        );

      case 'onboarding':
        return (
          <OnboardingScreen
            onComplete={() => setCurrentPage('auth')}
            onBack={() => setCurrentPage('terms')}
          />
        );

      case 'auth':
        return (
          <AuthScreen
            initialView={authInitialView}
            onAuthSuccess={handleAuthSuccess}
            onBack={() => setCurrentPage('onboarding')}
            onContinueAsGuest={() => {
              // Build guest profile with explicit isGuest flag
              handleAuthSuccess({
                name: 'Guest',
                age: 30,
                email: '',
                height: 165,
                weight: 60,
                cancerType: CancerType.CERVICAL,
                cancerStage: CancerStage.EARLY,
                otherConditions: [],
                treatmentStages: [],
                plan: 'Free',
                isGuest: true,
              });
            }}
          />
        );

      // ── GUEST ROUTE: completely separate from Dashboard ──────────────────
      case 'guest':
        if (!userProfile || !userProfile.isGuest) {
          // Safety fallback: not actually a guest — go to auth
          return (
            <AuthScreen
              initialView="initial"
              onAuthSuccess={handleAuthSuccess}
              onContinueAsGuest={() => { }}
              onBack={() => setCurrentPage('onboarding')}
            />
          );
        }
        return (
          <GuestPortal
            userProfile={userProfile}
            onSignUp={handleGuestSignUp}
          />
        );

      // ── DASHBOARD: only reached by authenticated (non-guest) users ───────
      case 'dashboard':
        if (!userProfile) {
          return (
            <AuthScreen
              initialView="signIn"
              onAuthSuccess={handleAuthSuccess}
              onContinueAsGuest={() => { }}
              onBack={() => setCurrentPage('onboarding')}
            />
          );
        }
        // Extra safety: guests should never be on this route, but redirect if so
        if (userProfile.isGuest) {
          setCurrentPage('guest');
          return <LoadingFallback />;
        }
        return <Dashboard userProfile={userProfile} onLogout={handleLogout} />;

      default:
        return <SplashScreen onGetStarted={() => setCurrentPage('terms')} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="bg-gradient-background-light dark:bg-gradient-background-dark font-sans min-h-screen">
        {/* Updated Container: W-full on mobile, max-w-md on tablet, max-w-lg on desktop, centered */}
        <div className="w-full sm:max-w-md md:max-w-lg mx-auto bg-transparent min-h-screen shadow-2xl shadow-emerald-900/20 dark:shadow-teal-900/50 relative">
          <Suspense fallback={<LoadingFallback />}>
            {renderPage()}
          </Suspense>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;