

import React, { useState, useCallback, useEffect } from 'react';
import { Page, UserProfile, CancerType, CancerStage } from './types';
import SplashScreen from './components/SplashScreen';
import TermsScreen from './components/TermsScreen';
import OnboardingScreen from './components/OnboardingScreen';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { db } from './services/db';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authInitialView, setAuthInitialView] = useState<'initial' | 'signIn'>('initial');

  // Check for existing session on startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const profile = await db.getSession();
        if (profile) {
          setUserProfile(profile);
          setCurrentPage('dashboard');
        }
      } catch (error) {
        console.error("Session check failed", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  const handleAuthSuccess = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentPage('dashboard');
  }, []);

  const handleLogout = useCallback(async () => {
    await db.signOut();
    setUserProfile(null);
    setAuthInitialView('signIn'); // Direct returning users to Sign In
    setCurrentPage('auth');
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'splash':
        return <SplashScreen onGetStarted={() => setCurrentPage('terms')} />;
      case 'terms':
        return <TermsScreen onAgree={() => setCurrentPage('onboarding')} />;
      case 'onboarding':
        return <OnboardingScreen onComplete={() => setCurrentPage('auth')} />;
      case 'auth':
        return (
          <AuthScreen 
            initialView={authInitialView}
            onAuthSuccess={handleAuthSuccess}
            onContinueAsGuest={() => {
              // Create a default guest profile - Guest sessions are not persisted in DB by default
              handleAuthSuccess({
                name: 'Guest',
                age: 30,
                email: '',
                gender: 'Prefer not to say',
                height: 165,
                weight: 60,
                cancerType: CancerType.CERVICAL,
                cancerStage: CancerStage.EARLY,
                otherConditions: [],
                treatmentStages: [],
                plan: 'Free',
              });
            }}
          />
        );
      case 'dashboard':
        return userProfile ? <Dashboard userProfile={userProfile} onLogout={handleLogout} /> : <AuthScreen onAuthSuccess={handleAuthSuccess} onContinueAsGuest={() => {}} />;
      default:
        return <SplashScreen onGetStarted={() => setCurrentPage('terms')} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="bg-gradient-background-light dark:bg-gradient-background-dark font-sans">
        <div className="max-w-sm mx-auto bg-transparent min-h-screen shadow-2xl shadow-emerald-900/20 dark:shadow-teal-900/50">
          {renderPage()}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;