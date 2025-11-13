import React from 'react';
import { LogoIcon } from './Icons';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col h-screen bg-gradient-primary p-8 text-center justify-between animate-fade-in">
      <div className="flex-grow flex flex-col items-center justify-center">
        <LogoIcon className="w-40 h-40 text-white mb-4 animate-fade-in-up filter drop-shadow-lg" style={{ animationDelay: '0.2s', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}/>
        <h1 className="text-5xl font-bold text-white dark:text-white animate-fade-in-up" style={{ animationDelay: '0.4s', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>NutriCan</h1>
        <p className="text-white/90 mt-2 dark:text-white/90 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>Healing Through Every Bite</p>
        <div className="mt-8 w-full max-w-72">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FNutriCan%20Fruits.png?alt=media&token=efe356dc-2b7f-4bd9-a390-9fd60469b794" 
            alt="Fruits and vegetables illustration" 
            className="w-full filter drop-shadow-xl" 
          />
        </div>
        <p className="text-white/80 mt-4 dark:text-white/80 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>Your personalized nutrition guide for the cancer journey.</p>
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