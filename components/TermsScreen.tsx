
import React from 'react';
import { LogoIcon } from './Icons';

interface TermsScreenProps {
  onAgree: () => void;
}

const TermsScreen: React.FC<TermsScreenProps> = ({ onAgree }) => {
  return (
    <div className="flex flex-col h-screen p-6 bg-transparent animate-fade-in">
      <div className="text-center">
        <LogoIcon className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-emerald-900 dark:text-gray-100">Terms & Conditions</h1>
      </div>
      <div className="flex-grow overflow-y-auto my-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl text-sm text-gray-600 space-y-3 dark:bg-slate-800/50 dark:text-gray-400 animate-fade-in-up border border-emerald-50 shadow-inner">
        <p>Welcome to NutriCan. By using our app, you agree to these terms.</p>
        <p className="font-bold text-emerald-800 dark:text-emerald-300">1. Medical Disclaimer:</p>
        <p>NutriCan provides nutritional information and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
        <p className="font-bold text-emerald-800 dark:text-emerald-300">2. Privacy Policy:</p>
        <p>We are committed to protecting your privacy. Our Privacy Policy explains how we collect, use, and share information about you.</p>
        <p className="font-bold text-emerald-800 dark:text-emerald-300">3. User Conduct:</p>
        <p>You agree to use the app responsibly and not for any unlawful purpose.</p>
        <p>...</p>
        <p>By clicking "Agree & Continue", you confirm that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.</p>
      </div>
      <div className="space-y-4">
        <button
          onClick={onAgree}
          className="btn-primary animate-pulse-glow"
        >
          Agree & Continue
        </button>
        <button
          onClick={() => alert("You must agree to the terms to use the app.")}
          className="btn-tertiary opacity-80 hover:opacity-100"
        >
          Disagree
        </button>
      </div>
    </div>
  );
};

export default TermsScreen;
