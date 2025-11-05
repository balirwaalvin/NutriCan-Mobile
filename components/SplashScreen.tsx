import React from 'react';
import { BowlIcon, LogoIcon } from './Icons';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col h-screen bg-soft-mint p-8 text-center justify-between dark:bg-gray-900 animate-fade-in">
      <div className="flex-grow flex flex-col items-center justify-center">
        <LogoIcon className="w-24 h-24 text-brand-mint mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}/>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>NutriCan</h1>
        <p className="text-gray-600 mt-2 dark:text-gray-300 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>Healing Through Every Bite</p>
        <div className="mt-12 w-full max-w-xs">
          <BowlIcon className="w-full text-brand-mint opacity-20" />
        </div>
        <p className="text-gray-500 mt-8 dark:text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>Your personalized nutrition guide for the cancer journey.</p>
      </div>
      <button
        onClick={onGetStarted}
        className="w-full bg-brand-mint text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-brand-mint/90 transition-transform transform hover:scale-105 animate-pulse-subtle"
      >
        Get Started
      </button>
    </div>
  );
};

export default SplashScreen;