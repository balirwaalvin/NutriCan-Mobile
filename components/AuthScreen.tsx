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
    });
  };
  
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demonstration, successful sign-in will use guest profile data.
    // In a real app, you would verify credentials against a backend.
    onAuthSuccess({
      name: 'Guest User',
      age: 30,
      email: formData.email,
      gender: 'Prefer not to say',
      cancerType: CancerType.CERVICAL,
      cancerStage: CancerStage.EARLY,
      otherConditions: [],
      treatmentStages: [],
    });
  };

  const renderSignUpStep1 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 text-center dark:text-gray-100">Create Your Account</h1>
      <input type="text" name="name" placeholder="Nickname" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white">
        <option>Female</option>
        <option>Male</option>
      </select>
      <button type="submit" className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Next</button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <button type="button" onClick={() => setView('signIn')} className="font-semibold text-brand-purple">Sign In</button>
      </p>
    </form>
  );

  const renderSignUpStep2 = () => (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">For Cervical Cancer</h1>
      <img 
        src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FCervical.png?alt=media&token=a93b20a3-e750-40d9-a8c0-8822dd560e9c" 
        alt="Cervical Cancer Information" 
        className="rounded-xl mx-auto my-4 w-full max-w-xs"
      />
      <p className="text-gray-500 mb-6 dark:text-gray-400">
        Please note that NutriCan is currently focused on providing support for individuals with Cervical Cancer.
      </p>
      <button onClick={handleNextStepClick} className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Continue</button>
    </div>
  );

  const renderSignUpStep3 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 text-center dark:text-gray-100">Health Profile</h1>
      <p className="text-center text-gray-500 dark:text-gray-400">Select any pre-existing conditions you have. You can skip this step if you have none.</p>
      
      <div className="space-y-2 pt-2">
        {Object.values(OtherCondition).map(cond => (
          <label key={cond} className="flex items-center space-x-3 p-3 border rounded-lg dark:border-gray-700 dark:text-gray-300 has-[:checked]:bg-purple-50 has-[:checked]:border-brand-purple dark:has-[:checked]:bg-purple-900/50 dark:has-[:checked]:border-brand-purple">
            <input type="checkbox" checked={formData.otherConditions.includes(cond)} onChange={() => handleCheckboxChange(cond)} className="h-5 w-5 text-brand-purple focus:ring-brand-purple rounded bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600" />
            <span>{cond}</span>
          </label>
        ))}
      </div>
      <button type="submit" className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Next</button>
    </form>
  );

  const renderSignUpStep4 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 text-center dark:text-gray-100">Cancer Stage</h1>
      <p className="text-center text-gray-500 mb-4 dark:text-gray-400">Please select your current cancer stage.</p>
      <select name="cancerStage" value={formData.cancerStage} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white">
        {Object.values(CancerStage).map(stage => <option key={stage}>{stage}</option>)}
      </select>
      <button type="submit" className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Next</button>
    </form>
  );

  const renderSignUpStep5 = () => (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Almost There!</h1>
      <p className="text-gray-500 mb-6 dark:text-gray-400">Just a couple more questions to personalize your experience.</p>
      <img src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2Fpatient%20filling%20form.png?alt=media&token=011d0896-a218-418a-a3a1-21c7174e17ce" alt="Patient filling out profile" className="rounded-xl mx-auto my-4 w-full max-w-xs"/>
      <button onClick={handleNextStepClick} className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Next</button>
    </div>
);

  const renderSignUpStep6 = () => (
    <form onSubmit={handleSignUpSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 text-center dark:text-gray-100">Treatment Stage</h1>
      <p className="text-center text-gray-500 dark:text-gray-400">Select your current treatment stage(s).</p>
      <div className="space-y-2 pt-2">
        {Object.values(TreatmentStage).map(stage => (
          <label key={stage} className="flex items-center space-x-3 p-3 border rounded-lg dark:border-gray-700 dark:text-gray-300 has-[:checked]:bg-purple-50 has-[:checked]:border-brand-purple dark:has-[:checked]:bg-purple-900/50 dark:has-[:checked]:border-brand-purple">
            <input type="checkbox" checked={formData.treatmentStages.includes(stage)} onChange={() => handleTreatmentStageChange(stage)} className="h-5 w-5 text-brand-purple focus:ring-brand-purple rounded bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600" />
            <span>{stage}</span>
          </label>
        ))}
      </div>
      <button type="submit" className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Complete Profile</button>
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
      <h1 className="text-2xl font-bold text-gray-800 text-center dark:text-gray-100">Sign In</h1>
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <button type="submit" className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Sign In</button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <button type="button" onClick={() => { setStep(1); setView('signUp'); }} className="font-semibold text-brand-purple">Sign Up</button>
      </p>
    </form>
  );

  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <LogoIcon className="w-24 h-24 text-brand-purple mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome to NutriCan</h1>
        <p className="text-gray-600 mt-2 mb-8 dark:text-gray-400">Your personalized nutrition guide.</p>
        <div className="w-full max-w-xs space-y-3">
             <button onClick={() => { setStep(1); setView('signUp'); }} className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl shadow-lg hover:bg-brand-purple/90 transition-transform transform hover:scale-105">
                Sign Up
            </button>
            <button onClick={() => setView('signIn')} className="w-full bg-white text-brand-purple font-bold py-3 rounded-xl border-2 border-brand-purple hover:bg-purple-50 transition">
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
    <div className="p-8 flex flex-col justify-center min-h-screen bg-white dark:bg-gray-900">
      <div key={view + step} className="animate-fade-in">
        {renderContent()}
      </div>
       <button onClick={onContinueAsGuest} className="text-center text-brand-purple mt-8 font-semibold absolute bottom-8 left-0 right-0">
        Continue as Guest
      </button>
    </div>
  );
};

export default AuthScreen;
