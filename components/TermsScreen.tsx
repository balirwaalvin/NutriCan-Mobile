import React from 'react';
import { LogoIcon } from './Icons';

interface TermsScreenProps {
  onAgree: () => void;
}

const TermsScreen: React.FC<TermsScreenProps> = ({ onAgree }) => {
  return (
    <div className="flex flex-col h-screen p-6 bg-transparent animate-fade-in">
      <div className="text-center">
        <LogoIcon className="w-16 h-16 text-brand-orange mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Terms & Conditions</h1>
      </div>
      <div className="flex-grow overflow-y-auto my-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-600 space-y-2 dark:bg-slate-800/50 dark:text-gray-400 animate-fade-in-up">
        <p>Welcome to NutriCan. By using our app, you agree to these terms.</p>
        <p className="font-semibold dark:text-gray-200">1. Medical Disclaimer:</p>
        <p>NutriCan provides nutritional information and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
        <p className="font-semibold dark:text-gray-200">2. Privacy Policy:</p>
        <p>We are committed to protecting your privacy. Our Privacy Policy explains how we collect, use, and share information about you.</p>
        <p className="font-semibold dark:text-gray-200">3. User Conduct:</p>
        <p>You agree to use the app responsibly and not for any unlawful purpose.</p>
        <p>...</p>
        <p>By clicking "Agree & Continue", you confirm that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy.</p>
      </div>
      <div className="space-y-3">
        <button
          onClick={onAgree}
          className="btn-primary animate-pulse-glow"
        >
          Agree & Continue
        </button>
        <button
          onClick={() => alert("You must agree to the terms to use the app.")}
          className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-300 transition dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
        >
          Disagree
        </button>
      </div>
    </div>
  );
};

export default TermsScreen;