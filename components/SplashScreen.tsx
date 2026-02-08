
import React from 'react';
import { LogoIcon } from './Icons';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col h-screen bg-transparent p-10 text-center justify-between relative overflow-hidden">
      {/* Dynamic Glow Spheres */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-green/20 blur-[150px] animate-pulse-soft"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-brand-teal/20 blur-[180px] animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center relative z-10">
        <div className="relative group mb-12">
          <div className="absolute inset-0 bg-brand-green/30 blur-[60px] rounded-full animate-pulse-soft"></div>
          <LogoIcon 
            className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] animate-float relative" 
            style={{ filter: 'drop-shadow(0 0 50px rgba(16,185,129,0.5))' }}
          />
        </div>
        
        <h1 className="text-6xl font-black text-emerald-950 dark:text-white tracking-tighter animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          NutriCan
        </h1>
        <div className="h-2 w-20 bg-brand-green rounded-full my-6 animate-fade-in-up shadow-glow-primary" style={{ animationDelay: '0.5s' }}></div>
        <p className="text-emerald-800 dark:text-emerald-300 font-black text-2xl animate-fade-in-up tracking-tight" style={{ animationDelay: '0.6s' }}>
          Healing Through Every Bite
        </p>
        
        <p className="text-gray-500 dark:text-white/40 mt-8 max-w-xs animate-fade-in-up text-sm font-bold leading-relaxed" style={{ animationDelay: '0.8s' }}>
          Personalized recovery nutrition guided by advanced AI intelligence.
        </p>
      </div>

      <div className="pb-12 relative z-10 animate-fade-in-up" style={{ animationDelay: '1s' }}>
        <div className="card-button-wrapper">
            <button
              onClick={onGetStarted}
              className="btn-primary w-full py-6 text-xl shadow-glow-large uppercase tracking-[0.2em] text-xs"
            >
              Begin Journey
            </button>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
