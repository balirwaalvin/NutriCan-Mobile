import React, { useState } from 'react';
import { UserProfile, CancerType, CancerStage, OtherCondition, TreatmentStage } from '../types';
import { LogoIcon } from './Icons';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
  onContinueAsGuest: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
  const [view, setView] = useState<'initial' | 'signIn' | 'signUp'>('initial');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', // For Nickname
    age: '',
    email: '',
    password: '',
    gender: 'Female' as 'Male' | 'Female',
    cancerType: CancerType.CERVICAL,
    otherConditions: [] as OtherCondition[],
    cancerStage: CancerStage.EARLY,
    treatmentStages: [] as TreatmentStage[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (condition: OtherCondition) => {
    setFormData(prev => {
      const newConditions = prev.otherConditions.includes(condition)
        ? prev.otherConditions.filter(c => c !== condition)
        : [...prev.otherConditions, condition];
      return { ...prev, otherConditions: newConditions };
    });
  };

  const handleTreatmentStageChange = (stage: TreatmentStage) => {
    setFormData(prev => {
      const newStages = prev.treatmentStages.includes(stage)
        ? prev.treatmentStages.filter(s => s !== stage)
        : [...prev.treatmentStages, stage];
      return { ...prev, treatmentStages: newStages };
    });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };
  
  // Wrapper to handle button clicks for next step
  const handleNextStepClick = () => {
    setStep(step + 1);
  }

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthSuccess({
      ...formData,
      age: parseInt(formData.age, 10),
      gender: formData.gender,
      plan: 'Free',
    });
  };
  
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demonstration, successful sign-in will use a premium profile to showcase features.
    // In a real app, you would verify credentials and fetch user plan from a backend.
    onAuthSuccess({
      name: 'Premium User',
      age: 30,
      email: formData.email,
      gender: 'Prefer not to say',
      cancerType: CancerType.CERVICAL,
      cancerStage: CancerStage.EARLY,
      otherConditions: [],
      treatmentStages: [],
      plan: 'Premium',
    });
  };

  const commonInputClasses = "w-full p-3 border-2 rounded-xl bg-white border-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none shadow-inner";

  const renderSignUpStep1 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">Create Your Account</h1>
      <input type="text" name="name" placeholder="Nickname" value={formData.name} onChange={handleChange} className={commonInputClasses} required />
      <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className={commonInputClasses} required />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={commonInputClasses} required />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={commonInputClasses} required />
      <select name="gender" value={formData.gender} onChange={handleChange} className={commonInputClasses}>
        <option>Female</option>
        <option>Male</option>
      </select>
      <button type="submit" className="btn-primary mt-6">Next</button>
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
        <p className="mb-2 font-medium">Already have an account?</p>
        <button type="button" onClick={() => setView('signIn')} className="btn-tertiary w-full mt-2">Sign In</button>
      </div>
    </form>
  );

  const renderSignUpStep2 = () => (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-emerald-900 dark:text-gray-100">For Cervical Cancer</h1>
      <img 
        src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FCervical.png?alt=media&token=a93b20a3-e750-40d9-a8c0-8822dd560e9c" 
        alt="Cervical Cancer Information" 
        className="rounded-xl mx-auto my-4 w-full max-w-xs shadow-lg border border-emerald-100"
      />
      <p className="text-gray-500 mb-6 dark:text-gray-400 px-4">
        Please note that NutriCan is currently focused on providing support for individuals with Cervical Cancer.
      </p>
      <button onClick={handleNextStepClick} className="btn-primary mt-4">Continue</button>
    </div>
  );

  const renderSignUpStep3 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">Health Profile</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-4">Select any pre-existing conditions you have. You can skip this step if you have none.</p>
      
      <div className="space-y-3">
        {Object.values(OtherCondition).map(cond => (
          <label key={cond} className="flex items-center space-x-3 p-4 border rounded-2xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 dark:has-[:checked]:bg-emerald-900/20 dark:has-[:checked]:border-emerald-500 transition-all cursor-pointer relative overflow-hidden transform active:scale-95 hover:-translate-y-0.5" style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none"></div>
            <input type="checkbox" checked={formData.otherConditions.includes(cond)} onChange={() => handleCheckboxChange(cond)} className="h-5 w-5 text-brand-green focus:ring-brand-green rounded bg-gray-100 border-gray-300 dark:bg-slate-700 dark:border-slate-600 relative z-10" />
            <span className="font-bold text-gray-700 dark:text-gray-200 relative z-10">{cond}</span>
          </label>
        ))}
      </div>
      <button type="submit" className="btn-primary mt-6">Next</button>
    </form>
  );

  const renderSignUpStep4 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">Cancer Stage</h1>
      <p className="text-center text-gray-500 mb-6 dark:text-gray-400">Please select your current cancer stage.</p>
      <select name="cancerStage" value={formData.cancerStage} onChange={handleChange} className={commonInputClasses}>
        {Object.values(CancerStage).map(stage => <option key={stage}>{stage}</option>)}
      </select>
      <button type="submit" className="btn-primary mt-6">Next</button>
    </form>
  );

  const renderSignUpStep5 = () => (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-emerald-900 dark:text-gray-100">Almost There!</h1>
      <p className="text-gray-500 mb-6 dark:text-gray-400">Just a couple more questions to personalize your experience.</p>
      <img src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2Fpatient%20filling%20form.png?alt=media&token=011d0896-a218-418a-a3a1-21c7174e17ce" alt="Patient filling out profile" className="rounded-xl mx-auto my-4 w-full max-w-xs shadow-lg"/>
      <button onClick={handleNextStepClick} className="btn-primary mt-6">Next</button>
    </div>
);

  const renderSignUpStep6 = () => (
    <form onSubmit={handleSignUpSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">Treatment Stage</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-4">Select your current treatment stage(s).</p>
      <div className="space-y-3">
        {Object.values(TreatmentStage).map(stage => (
          <label key={stage} className="flex items-center space-x-3 p-4 border rounded-2xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-500 dark:has-[:checked]:bg-emerald-900/20 dark:has-[:checked]:border-emerald-500 transition-all cursor-pointer relative overflow-hidden transform active:scale-95 hover:-translate-y-0.5" style={{ boxShadow: '0 4px 0 rgba(0,0,0,0.1)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none"></div>
            <input type="checkbox" checked={formData.treatmentStages.includes(stage)} onChange={() => handleTreatmentStageChange(stage)} className="h-5 w-5 text-brand-green focus:ring-brand-green rounded bg-gray-100 border-gray-300 dark:bg-slate-700 dark:border-slate-600 relative z-10" />
            <span className="font-bold text-gray-700 dark:text-gray-200 relative z-10">{stage}</span>
          </label>
        ))}
      </div>
      <button type="submit" className="btn-primary mt-6">Complete Profile</button>
    </form>
  );


  const renderSignUpFlow = () => {
    switch(step) {
      case 1: return renderSignUpStep1();
      case 2: return renderSignUpStep2();
      case 3: return renderSignUpStep3();
      case 4: return renderSignUpStep4();
      case 5: return renderSignUpStep5();
      case 6: return renderSignUpStep6();
      default: return renderSignUpStep1();
    }
  }

  const renderSignInForm = () => (
    <form onSubmit={handleSignInSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">Sign In</h1>
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={commonInputClasses} required />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={commonInputClasses} required />
      <button type="submit" className="btn-primary mt-6">Sign In</button>
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
        <p className="mb-2 font-medium">Don't have an account?</p>
        <button type="button" onClick={() => { setStep(1); setView('signUp'); }} className="btn-tertiary w-full mt-2">Sign Up</button>
      </div>
    </form>
  );

  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <LogoIcon className="w-24 h-24 text-emerald-600 mx-auto mb-4 filter drop-shadow-[0_0_15px_rgba(5,150,105,0.4)]" />
        <h1 className="text-4xl font-bold text-emerald-900 dark:text-gray-100">Welcome to NutriCan</h1>
        <p className="text-emerald-700 mt-2 mb-10 dark:text-emerald-400 font-medium">Your personalized nutrition guide.</p>
        <div className="w-full max-w-xs space-y-8">
             <button onClick={() => { setStep(1); setView('signUp'); }} className="btn-primary text-lg">
                Sign Up
            </button>
            <button onClick={() => setView('signIn')} className="btn-secondary text-lg">
                Sign In
            </button>
        </div>
    </div>
  );
  
  const renderContent = () => {
    switch(view) {
      case 'initial': return renderInitialView();
      case 'signIn': return renderSignInForm();
      case 'signUp': return renderSignUpFlow();
      default: return renderInitialView();
    }
  }

  return (
    <div className="p-8 flex flex-col justify-center min-h-screen bg-transparent relative">
      <div key={view + step} className="animate-fade-in pb-16">
        {renderContent()}
      </div>
      {view === 'initial' && (
       <button onClick={onContinueAsGuest} className="btn-tertiary absolute bottom-8 left-8 right-8 w-auto backdrop-blur-sm opacity-90 hover:opacity-100 text-sm py-3">
        Continue as Guest
      </button>
      )}
    </div>
  );
};

export default AuthScreen;