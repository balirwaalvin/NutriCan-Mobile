
import React from 'react';
import { LogoIcon } from './Icons';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col h-screen bg-gradient-mesh p-8 text-center justify-between relative overflow-hidden">
      {/* Animated background element */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-emerald/20 blur-[100px] animate-pulse-soft"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-teal/20 blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center relative z-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-brand-green/30 blur-[40px] rounded-full animate-pulse-glow"></div>
          <LogoIcon 
            className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] mb-8 animate-float filter drop-shadow-2xl relative" 
            style={{ filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.4))' }}
          />
        </div>
        
        <h1 className="text-5xl font-extrabold text-emerald-900 dark:text-white tracking-tight animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          NutriCan
        </h1>
        <div className="h-1.5 w-16 bg-brand-green rounded-full my-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}></div>
        <p className="text-emerald-800 dark:text-emerald-300/90 text-xl font-medium animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          Healing Through Every Bite
        </p>
        
        <p className="text-gray-600 dark:text-white/60 mt-6 max-w-xs animate-fade-in-up text-sm leading-relaxed" style={{ animationDelay: '0.8s' }}>
          Empowering your recovery with AI-driven nutrition tailored for your journey.
        </p>
      </div>

      <div className="pb-10 relative z-10">
        <button
          onClick={onGetStarted}
          className="btn-primary w-full py-4 text-lg font-bold rounded-2xl animate-fade-in-up shadow-glow-large"
          style={{ animationDelay: '1s' }}
        >
          Begin Journey
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
