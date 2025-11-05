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
                cancerType: CancerType.BREAST,
                cancerStage: CancerStage.EARLY,
                otherConditions: []
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
      <div className="min-h-screen bg-soft-lavender/20 font-sans dark:bg-gray-900">
        <div className="max-w-sm mx-auto bg-white min-h-screen shadow-2xl shadow-purple-200 dark:bg-gray-800 dark:shadow-purple-900/50">
          {renderPage()}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
