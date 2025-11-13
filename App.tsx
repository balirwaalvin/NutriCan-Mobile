import React, { useState, useCallback } from 'react';
import { Page, UserProfile, CancerType, CancerStage } from './types';
import SplashScreen from './components/SplashScreen';
import TermsScreen from './components/TermsScreen';
import OnboardingScreen from './components/OnboardingScreen';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleAuthSuccess = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentPage('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    setUserProfile(null);
    setCurrentPage('splash');
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
            onAuthSuccess={handleAuthSuccess}
            onContinueAsGuest={() => {
              // Create a default guest profile
              handleAuthSuccess({
                name: 'Guest',
                age: 30,
                email: '',
                gender: 'Prefer not to say',
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