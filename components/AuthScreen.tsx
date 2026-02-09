
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
    gender: 'Female' as 'Male' | 'Female' | 'Other' | 'Prefer not to say', 
    cancerType: CancerType.CERVICAL,
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

  const handleTreatmentChange = (stage: TreatmentStage) => {
    setFormData(prev => {
      const isSelected = prev.treatmentStages.includes(stage);
      const newStages = isSelected ? prev.treatmentStages.filter(s => s !== stage) : [...prev.treatmentStages, stage];
      return { ...prev, treatmentStages: newStages };
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

  const inputClasses = "w-full p-4 border-2 rounded-[1.5rem] glass-panel border-white/40 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-bold text-lg shadow-inner bg-white/50 dark:bg-emerald-900/10 text-emerald-950 dark:text-white placeholder-emerald-900/30 dark:placeholder-white/30";

  const renderSignUpStep1 = () => (
    <form onSubmit={(e) => { e.preventDefault(); if (formData.password.length < 6) setError("Too short"); else handleNextStep(e); }} className="space-y-5 max-w-sm mx-auto animate-fade-in-up">
      <h1 className="text-3xl font-black text-emerald-900 text-center dark:text-white tracking-tight mb-6">Personal Details</h1>
      <input type="text" name="name" placeholder="Nickname" value={formData.name} onChange={handleChange} className={inputClasses} required />
      
      <div className="grid grid-cols-2 gap-4">
        <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className={inputClasses} required />
        <select name="gender" value={formData.gender} onChange={handleChange} className={inputClasses} required>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
        </select>
      </div>

      <div className="flex gap-4">
          <input type="number" name="height" placeholder="Height (cm)" value={formData.height} onChange={handleChange} className={inputClasses} required />
          <input type="number" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} className={inputClasses} required />
      </div>
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={inputClasses} required />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={inputClasses} required />
      {error && <p className="text-red-500 text-center text-sm font-bold bg-red-100 p-2 rounded-xl">{error}</p>}
      <div className="card-button-wrapper mt-6">
        <button type="submit" className="btn-primary w-full">Next Step</button>
      </div>
    </form>
  );

  const renderSignUpStep2 = () => (
    <form onSubmit={handleSignUpSubmit} className="space-y-6 max-w-sm mx-auto animate-fade-in-up pb-10">
      <h1 className="text-3xl font-black text-emerald-900 text-center dark:text-white tracking-tight">Medical Profile</h1>
      <p className="text-center text-emerald-700/60 dark:text-emerald-200/60 text-sm font-bold -mt-4">Help us personalize your recovery plan.</p>

      {/* Cancer Type & Stage */}
      <div className="space-y-4">
          <div className="glass-panel p-4 rounded-[1.5rem] border-2 border-transparent focus-within:border-emerald-500 transition-colors">
              <label className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest block mb-2">Diagnosis</label>
              <select name="cancerType" value={formData.cancerType} onChange={handleChange} className="w-full bg-transparent font-bold text-emerald-950 dark:text-white outline-none">
                  {Object.values(CancerType).map(t => <option key={t} value={t} className="text-black">{t}</option>)}
              </select>
          </div>

          <div className="glass-panel p-4 rounded-[1.5rem] border-2 border-transparent focus-within:border-emerald-500 transition-colors">
              <label className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest block mb-2">Current Stage</label>
              <select name="cancerStage" value={formData.cancerStage} onChange={handleChange} className="w-full bg-transparent font-bold text-emerald-950 dark:text-white outline-none">
                  {Object.values(CancerStage).map(s => <option key={s} value={s} className="text-black">{s}</option>)}
              </select>
          </div>
      </div>

      {/* Other Conditions */}
      <div>
        <label className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest block mb-3 px-2">Other Conditions</label>
        <div className="space-y-3">
          {Object.values(OtherCondition).map((condition) => {
            const isChecked = formData.otherConditions.includes(condition);
            return (
              <div key={condition} className={`p-4 rounded-[1.5rem] border-2 transition-all ${isChecked ? 'bg-brand-green/10 border-brand-green' : 'bg-white/40 dark:bg-emerald-900/20 border-transparent'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'border-brand-green bg-brand-green' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <input type="checkbox" checked={isChecked} onChange={() => handleCheckboxChange(condition)} className="hidden" />
                  <span className="font-bold text-sm text-emerald-950 dark:text-white">{condition}</span>
                </label>
                
                {isChecked && CONDITION_LEVELS[condition] && (
                     <div className="mt-3 pl-8 animate-fade-in">
                        <select
                             value={formData.conditionDetails[condition] || CONDITION_LEVELS[condition][0]}
                             onChange={(e) => {
                                 setFormData(prev => ({
                                     ...prev,
                                     conditionDetails: { ...prev.conditionDetails, [condition]: e.target.value }
                                 }));
                             }}
                             className="w-full p-2 bg-white/50 dark:bg-black/20 rounded-xl text-xs font-bold outline-none text-emerald-900 dark:text-white border border-emerald-500/20"
                        >
                            {CONDITION_LEVELS[condition].map(level => (
                                <option key={level} value={level} className="text-black">{level}</option>
                            ))}
                        </select>
                     </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Treatment Phase */}
      <div>
          <label className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest block mb-3 px-2">Treatment Phase</label>
          <div className="flex flex-wrap gap-3">
              {Object.values(TreatmentStage).map((stage) => {
                  const isSelected = formData.treatmentStages.includes(stage);
                  return (
                      <button
                          key={stage}
                          type="button"
                          onClick={() => handleTreatmentChange(stage)}
                          className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${isSelected ? 'bg-brand-green text-white border-brand-green shadow-glow-primary' : 'bg-white/40 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 border-transparent'}`}
                      >
                          {stage}
                      </button>
                  )
              })}
          </div>
      </div>

      <div className="card-button-wrapper mt-8">
        <button type="submit" disabled={isLoading} className="btn-primary w-full shadow-glow-large">
          {isLoading ? <LogoIcon className="w-6 h-6 animate-spin" /> : 'Create Account'}
        </button>
      </div>
    </form>
  );

  const renderSignIn = () => (
    <form onSubmit={handleSignInSubmit} className="space-y-6 max-w-sm mx-auto animate-fade-in-up">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-emerald-950 dark:text-white tracking-tighter mb-2">Welcome Back</h1>
            <p className="text-emerald-800/60 dark:text-emerald-200/60 font-bold">Continue your journey.</p>
        </div>
        
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={inputClasses} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={inputClasses} required />
        
        {error && <p className="text-red-500 text-center text-sm font-bold bg-red-100 p-3 rounded-xl">{error}</p>}
        
        <div className="card-button-wrapper mt-8">
            <button type="submit" disabled={isLoading} className="btn-primary w-full shadow-glow-large">
                {isLoading ? <LogoIcon className="w-6 h-6 animate-spin" /> : 'Sign In'}
            </button>
        </div>
    </form>
  );

  const renderInitial = () => (
      <div className="flex flex-col h-full justify-center animate-fade-in text-center px-4">
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-brand-green/20 blur-[60px] rounded-full animate-pulse-soft"></div>
            <LogoIcon className="w-32 h-32 mx-auto text-emerald-600 relative z-10 drop-shadow-2xl" />
          </div>
          <h1 className="text-4xl font-black text-emerald-950 dark:text-white tracking-tighter mb-4">NutriCan</h1>
          <p className="text-gray-500 dark:text-emerald-100/60 font-bold mb-12 max-w-xs mx-auto leading-relaxed">
            Your personalized guide to nutrition and wellness during recovery.
          </p>

          <div className="space-y-4 max-w-xs mx-auto w-full">
              <div className="card-button-wrapper">
                  <button onClick={() => setView('signIn')} className="btn-primary w-full shadow-glow-primary">Sign In</button>
              </div>
              <div className="card-button-wrapper !bg-transparent border-none p-0">
                  <button onClick={() => setView('signUp')} className="btn-secondary w-full">Create Account</button>
              </div>
              <button onClick={handleGuestLogin} className="text-xs font-black uppercase tracking-widest text-emerald-700/60 dark:text-emerald-200/40 mt-4 hover:text-brand-green transition-colors">
                  Continue as Guest
              </button>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-transparent p-6 relative overflow-x-hidden">
      {view !== 'initial' && (
        <button onClick={handleBack} className="absolute top-6 left-6 z-20 p-3 glass-panel rounded-full text-emerald-900 dark:text-white hover:scale-110 transition-transform shadow-md">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}

      <div className="flex-grow flex flex-col justify-center relative z-10">
        {view === 'initial' && renderInitial()}
        {view === 'signIn' && renderSignIn()}
        {view === 'signUp' && step === 1 && renderSignUpStep1()}
        {view === 'signUp' && step === 2 && renderSignUpStep2()}
      </div>
    </div>
  );
};

export default AuthScreen;
