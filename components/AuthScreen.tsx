
import React, { useState, useEffect } from 'react';
import { UserProfile, CancerType, CancerStage, OtherCondition, TreatmentStage } from '../types';
import { LogoIcon, ChevronLeftIcon } from './Icons';
import { db } from '../services/db';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
  onContinueAsGuest: () => void;
  onBack: () => void;
  initialView?: 'initial' | 'signIn' | 'signUp';
}

const CONDITION_LEVELS: Record<string, string[]> = {
  [OtherCondition.DIABETES]: ['Type 1', 'Type 2', 'Prediabetes', 'Gestational'],
  [OtherCondition.HYPERTENSION]: ['Elevated', 'Stage 1', 'Stage 2', 'Hypertensive Crisis'],
  [OtherCondition.HYPOTENSION]: ['Mild', 'Chronic', 'Orthostatic', 'Severe'],
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest, onBack, initialView = 'initial' }) => {
  const [view, setView] = useState<'initial' | 'signIn' | 'signUp'>(initialView);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setView(initialView); }, [initialView]);

  const [formData, setFormData] = useState({
    name: '', age: '', height: '', weight: '', email: '', password: '',
    gender: 'Female' as 'Male' | 'Female', cancerType: CancerType.CERVICAL,
    otherConditions: [] as string[], conditionDetails: {} as Record<string, string>,
    cancerStage: CancerStage.EARLY, treatmentStages: [] as TreatmentStage[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };
  
  const handleCheckboxChange = (condition: string) => {
    setFormData(prev => {
      const isSelected = prev.otherConditions.includes(condition);
      const newConditions = isSelected ? prev.otherConditions.filter(c => c !== condition) : [...prev.otherConditions, condition];
      const newDetails = { ...prev.conditionDetails };
      if (!isSelected && CONDITION_LEVELS[condition]) newDetails[condition] = CONDITION_LEVELS[condition][0];
      else if (isSelected) delete newDetails[condition];
      return { ...prev, otherConditions: newConditions, conditionDetails: newDetails };
    });
  };

  const handleNextStep = (e: React.FormEvent) => { e.preventDefault(); setStep(step + 1); };
  const handleBack = () => {
      if (view === 'signUp') { if (step > 1) setStep(step - 1); else setView('initial'); }
      else if (view === 'signIn') setView('initial');
      else onBack();
      setError(null);
  };

  const handleGuestLogin = async () => {
      setIsLoading(true);
      try { const profile = await db.signInAnonymously(); onAuthSuccess(profile); }
      catch { onContinueAsGuest(); } finally { setIsLoading(false); }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const profile: UserProfile = {
            name: formData.name, age: parseInt(formData.age, 10), height: parseInt(formData.height, 10),
            weight: parseInt(formData.weight, 10), email: formData.email, gender: formData.gender,
            cancerType: formData.cancerType, cancerStage: formData.cancerStage,
            otherConditions: formData.otherConditions.map(c => formData.conditionDetails[c] ? `${c} (${formData.conditionDetails[c]})` : c),
            treatmentStages: formData.treatmentStages, plan: 'Free',
        };
        await db.signUp(formData.email, formData.password, profile);
        onAuthSuccess(profile);
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };
  
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try { const profile = await db.signIn(formData.email, formData.password); onAuthSuccess(profile); }
    catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  const inputClasses = "w-full p-4 border-2 rounded-[1.5rem] glass-panel border-white/40 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-lg shadow-inner";

  const renderSignUpStep1 = () => (
    <form onSubmit={(e) => { e.preventDefault(); if (formData.password.length < 6) setError("Too short"); else handleNextStep(e); }} className="space-y-6 max-w-sm mx-auto animate-fade-in-up">
      <h1 className="text-3xl font-black text-emerald-900 text-center dark:text-white tracking-tight">Personal Details</h1>
      <input type="text" name="name" placeholder="Nickname" value={formData.name} onChange={handleChange} className={inputClasses} required />
      <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className={inputClasses} required />
      <div className="flex gap-4">
          <input type="number" name="height" placeholder="Height (cm)" value={formData.height} onChange={handleChange} className={inputClasses} required />
          <input type="number" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} className={inputClasses} required />
      </div>
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={inputClasses} required />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={inputClasses} required />
      {error && <p className="text-red-500 text-center text-sm font-bold">{error}</p>}
      <div className="card-button-wrapper mt-6">
        <button type="submit" className="btn-primary w-full">Next Step</button>
      </div>
    </form>
  );

  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center h-full text-center pt-10 animate-fade-in">
        <LogoIcon className="w-44 h-44 mb-8 animate-float filter drop-shadow-2xl" />
        <h1 className="text-4xl font-black text-emerald-900 dark:text-white tracking-tighter mb-2">Join NutriCan</h1>
        <p className="text-emerald-700/70 dark:text-emerald-400 font-bold mb-12">Your recovery begins here.</p>
        <div className="w-full max-w-xs space-y-6">
            <div className="card-button-wrapper">
              <button onClick={() => setView('signUp')} className="btn-primary w-full !py-5 shadow-glow-primary">Create Account</button>
            </div>
            <div className="flex items-center gap-4 text-emerald-900/30 dark:text-white/20">
              <div className="h-px bg-current flex-grow"></div>
              <span className="font-black uppercase text-[10px] tracking-widest">or</span>
              <div className="h-px bg-current flex-grow"></div>
            </div>
            <button onClick={() => setView('signIn')} className="btn-secondary w-full !rounded-3xl !py-5 font-black uppercase text-xs tracking-widest">Sign In</button>
        </div>
    </div>
  );

  return (
    <div className="p-8 flex flex-col min-h-screen bg-transparent relative">
      <button onClick={handleBack} className="absolute top-8 left-8 p-3 glass-panel rounded-full shadow-lg active:scale-90 transition-all z-50">
        <ChevronLeftIcon className="w-6 h-6 text-emerald-900 dark:text-white" />
      </button>
      <div className="flex-grow flex flex-col justify-center">
        {view === 'initial' ? renderInitialView() : 
         view === 'signIn' ? (
           <form onSubmit={handleSignInSubmit} className="space-y-6 max-w-sm mx-auto animate-fade-in-up">
             <h1 className="text-3xl font-black text-emerald-900 dark:text-white text-center mb-8">Sign In</h1>
             <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={inputClasses} required />
             <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={inputClasses} required />
             {error && <p className="text-red-500 text-center text-sm font-bold">{error}</p>}
             <div className="card-button-wrapper">
                <button type="submit" disabled={isLoading} className="btn-primary w-full">{isLoading ? 'Signing In...' : 'Enter App'}</button>
             </div>
           </form>
         ) : 
         (step === 1 ? renderSignUpStep1() : 
          <div className="text-center animate-fade-in-up">
            <h1 className="text-3xl font-black text-emerald-950 dark:text-white mb-6">Complete Profile</h1>
            <p className="text-gray-500 font-medium mb-12 italic">Almost finished with your setup...</p>
            <div className="card-button-wrapper">
              <button onClick={handleSignUpSubmit} className="btn-primary w-full">Finalize Account</button>
            </div>
          </div>
         )
        }
      </div>
      {view === 'initial' && (
        <button onClick={handleGuestLogin} className="mt-12 text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:scale-105 transition-transform">
          Continue as Guest
        </button>
      )}
    </div>
  );
};

export default AuthScreen;
