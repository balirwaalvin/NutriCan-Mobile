
import React from 'react';
import { LogoIcon } from './Icons';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col h-screen bg-gradient-primary p-8 text-center justify-between animate-fade-in">
      <div className="flex-grow flex flex-col items-center justify-center">
        {/* Increased logo size significantly and removed other illustrations */}
        <LogoIcon className="w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] text-white mb-6 animate-fade-in-up filter drop-shadow-lg object-contain" style={{ animationDelay: '0.2s', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}/>
        <h1 className="text-5xl font-bold text-white dark:text-white animate-fade-in-up" style={{ animationDelay: '0.4s', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>NutriCan</h1>
        <p className="text-white/90 mt-4 text-lg dark:text-white/90 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>Healing Through Every Bite</p>
        
        <p className="text-white/80 mt-8 max-w-xs dark:text-white/80 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>Your personalized nutrition guide for the cancer journey.</p>
      </div>
      <button
        onClick={onGetStarted}
        className="btn-primary animate-pulse-glow"
      >
        Get Started
      </button>
    </div>
  );
};

export default SplashScreen;
