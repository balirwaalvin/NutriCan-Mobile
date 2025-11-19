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
  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);

  // Update view if initialView prop changes
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const [formData, setFormData] = useState({
    name: '', // For Nickname
    age: '',
    height: '', // cm
    weight: '', // kg
    email: '',
    password: '',
    gender: 'Female' as 'Male' | 'Female',
    cancerType: CancerType.CERVICAL,
    otherConditions: [] as string[],
    conditionDetails: {} as Record<string, string>,
    cancerStage: CancerStage.EARLY,
    treatmentStages: [] as TreatmentStage[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };
  
  const handleCheckboxChange = (condition: string) => {
    setFormData(prev => {
      const isSelected = prev.otherConditions.includes(condition);
      const newConditions = isSelected
        ? prev.otherConditions.filter(c => c !== condition)
        : [...prev.otherConditions, condition];
      
      const newDetails = { ...prev.conditionDetails };
      
      if (!isSelected && CONDITION_LEVELS[condition]) {
        // Default to the first level if selecting
        newDetails[condition] = CONDITION_LEVELS[condition][0];
      } else if (isSelected) {
        // Clean up details if unselecting
        delete newDetails[condition];
      }

      return { ...prev, otherConditions: newConditions, conditionDetails: newDetails };
    });
  };

  const handleDetailChange = (condition: string, detail: string) => {
    setFormData(prev => ({
        ...prev,
        conditionDetails: {
            ...prev.conditionDetails,
            [condition]: detail
        }
    }));
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

  const handleBack = () => {
      if (view === 'signUp') {
          if (step > 1) {
              setStep(step - 1);
          } else {
              if (isGoogleSignUp) {
                  // If they cancel google sign up flow, maybe sign them out and go back to initial
                  db.signOut(); 
                  setIsGoogleSignUp(false);
              }
              setView('initial');
              setStep(1);
          }
      } else if (view === 'signIn') {
          setView('initial');
      } else {
          // In initial view
          onBack();
      }
      setError(null);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        // Merge condition names with their selected levels
        const processedConditions = formData.otherConditions.map(cond => {
            const detail = formData.conditionDetails[cond];
            return detail ? `${cond} (${detail})` : cond;
        });

        const profile: UserProfile = {
            name: formData.name,
            age: parseInt(formData.age, 10),
            height: parseInt(formData.height, 10),
            weight: parseInt(formData.weight, 10),
            email: formData.email,
            gender: formData.gender,
            cancerType: formData.cancerType,
            cancerStage: formData.cancerStage,
            otherConditions: processedConditions,
            treatmentStages: formData.treatmentStages,
            plan: 'Free',
        };

        if (isGoogleSignUp) {
            // User is already authenticated via Google, just save the profile
            await db.saveProfile(profile);
        } else {
            // Standard email/pass sign up
            await db.signUp(formData.email, formData.password, profile);
        }
        
        onAuthSuccess(profile);
    } catch (err: any) {
        setError(err.message || "An unexpected error occurred during sign up.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        const profile = await db.signIn(formData.email, formData.password);
        onAuthSuccess(profile);
    } catch (err: any) {
        setError(err.message || "An unexpected error occurred during sign in.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { profile, isNewUser } = await db.signInWithGoogle();
      
      if (isNewUser) {
        // If user is new, redirect to Sign Up flow to fill details
        setIsGoogleSignUp(true);
        setFormData(prev => ({
            ...prev,
            name: profile.name,
            email: profile.email,
        }));
        setView('signUp');
        setStep(1); // Start at Step 1 to verify/fill Age/Height/Weight
      } else {
         onAuthSuccess(profile);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputClasses = "w-full p-3 border-2 rounded-xl bg-white border-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none shadow-inner";

  // Spinner Component
  const LoadingSpinner = () => (
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl z-20">
          <LogoIcon className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
  );

  const renderGoogleButton = () => (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-900/50 text-gray-500 rounded-full">Or continue with</span>
        </div>
      </div>
      
      <button 
        type="button" 
        onClick={handleGoogleSignIn} 
        className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-white font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
        disabled={isLoading}
      >
         <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
         Google
      </button>
    </>
  );

  const renderSignUpStep1 = () => {
    // For Google users, password is implicitly valid (not used)
    const isPasswordValid = isGoogleSignUp || formData.password.length >= 6;

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid) {
             setError("Password must be at least 6 characters long.");
             return;
        }
        handleNextStep(e);
    };

    return (
    <form onSubmit={handleStep1Submit} className="space-y-4 relative max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">
          {isGoogleSignUp ? 'Complete Your Profile' : 'Create Your Account'}
      </h1>
      <input type="text" name="name" placeholder="Nickname" value={formData.name} onChange={handleChange} className={commonInputClasses} required />
      
      <div className="flex space-x-2">
          <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className={commonInputClasses} required />
          <select name="gender" value={formData.gender} onChange={handleChange} className={commonInputClasses}>
            <option>Female</option>
            <option>Male</option>
          </select>
      </div>

      <div className="flex space-x-2">
          <input type="number" name="height" placeholder="Height (cm)" value={formData.height} onChange={handleChange} className={commonInputClasses} required min="50" max="300" />
          <input type="number" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} className={commonInputClasses} required min="20" max="300" />
      </div>

      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={commonInputClasses} required disabled={isGoogleSignUp} />
      
      {!isGoogleSignUp && (
      <div>
        <input 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={formData.password} 
            onChange={handleChange} 
            className={`${commonInputClasses} ${formData.password.length > 0 && !isPasswordValid ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}`} 
            required 
        />
        <div className="mt-2 flex items-center gap-2 text-xs px-1 transition-all duration-300">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                formData.password.length === 0 ? 'bg-gray-300' :
                isPasswordValid ? 'bg-emerald-500' : 'bg-red-500'
            }`} />
            <span className={`font-medium transition-colors duration-300 ${
                formData.password.length === 0 ? 'text-gray-500' :
                isPasswordValid ? 'text-emerald-600' : 'text-red-500'
            }`}>
                {isPasswordValid ? 'Password meets requirements' : 'Must be at least 6 characters'}
            </span>
        </div>
      </div>
      )}
      
      {error && step === 1 && <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm text-center animate-pulse">{error}</div>}

      <button type="submit" className="btn-primary mt-6">Next</button>

      {!isGoogleSignUp && renderGoogleButton()}
      
      {!isGoogleSignUp && (
        <div className="relative mt-8 pt-4 border-t border-emerald-100 dark:border-slate-700">
            <p className="mb-3 font-medium text-center text-gray-600 dark:text-gray-400 text-sm">Already have an account?</p>
            <button type="button" onClick={() => { setView('signIn'); setError(null); }} className="btn-tertiary w-full">Sign In</button>
        </div>
      )}
    </form>
    );
  };

  const renderSignUpStep2 = () => (
    <div className="text-center max-w-sm mx-auto">
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
    <form onSubmit={handleNextStep} className="space-y-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">Health Profile</h1>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-4">Select any pre-existing conditions and their severity.</p>
      
      <div className="space-y-4">
        {Object.values(OtherCondition).map(cond => {
            const isChecked = formData.otherConditions.includes(cond);
            return (
                <div key={cond} className={`border rounded-2xl transition-all duration-200 ${isChecked ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500 shadow-md' : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                    <label className="flex items-center space-x-3 p-4 cursor-pointer relative z-10">
                        <input type="checkbox" checked={isChecked} onChange={() => handleCheckboxChange(cond)} className="h-5 w-5 text-brand-green focus:ring-brand-green rounded bg-gray-100 border-gray-300 dark:bg-slate-700 dark:border-slate-600" />
                        <span className="font-bold text-gray-700 dark:text-gray-200">{cond}</span>
                    </label>
                    
                    {isChecked && CONDITION_LEVELS[cond] && (
                         <div className="px-4 pb-4 animate-fade-in">
                             <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 ml-1">Select Severity / Type:</label>
                             <select 
                                value={formData.conditionDetails[cond] || ''} 
                                onChange={(e) => handleDetailChange(cond, e.target.value)}
                                className="w-full p-2 text-sm border border-emerald-200 rounded-lg bg-white text-gray-700 focus:ring-1 focus:ring-emerald-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                             >
                                 {CONDITION_LEVELS[cond].map(level => (
                                     <option key={level} value={level}>{level}</option>
                                 ))}
                             </select>
                         </div>
                    )}
                </div>
            );
        })}
      </div>
      <button type="submit" className="btn-primary mt-6">Next</button>
    </form>
  );

  const renderSignUpStep4 = () => (
    <form onSubmit={handleNextStep} className="space-y-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">Cancer Stage</h1>
      <p className="text-center text-gray-500 mb-6 dark:text-gray-400">Please select your current cancer stage.</p>
      <select name="cancerStage" value={formData.cancerStage} onChange={handleChange} className={commonInputClasses}>
        {Object.values(CancerStage).map(stage => <option key={stage}>{stage}</option>)}
      </select>
      <button type="submit" className="btn-primary mt-6">Next</button>
    </form>
  );

  const renderSignUpStep5 = () => (
    <div className="text-center max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-emerald-900 dark:text-gray-100">Almost There!</h1>
      <p className="text-gray-500 mb-6 dark:text-gray-400">Just a couple more questions to personalize your experience.</p>
      <img src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2Fpatient%20filling%20form.png?alt=media&token=011d0896-a218-418a-a3a1-21c7174e17ce" alt="Patient filling out profile" className="rounded-xl mx-auto my-4 w-full max-w-xs shadow-lg"/>
      <button onClick={handleNextStepClick} className="btn-primary mt-6">Next</button>
    </div>
);

  const renderSignUpStep6 = () => (
    <form onSubmit={handleSignUpSubmit} className="space-y-4 relative max-w-sm mx-auto">
      {isLoading && <LoadingSpinner />}
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
      {error && <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm text-center animate-pulse">{error}</div>}
      <button type="submit" className="btn-primary mt-6" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Complete Profile'}
      </button>
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
    <form onSubmit={handleSignInSubmit} className="space-y-4 relative max-w-sm mx-auto">
      {isLoading && <LoadingSpinner />}
      <h1 className="text-2xl font-bold text-emerald-900 text-center dark:text-gray-100">Sign In</h1>
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className={commonInputClasses} required disabled={isLoading} />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={commonInputClasses} required disabled={isLoading} />
      
      {error && <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm text-center animate-pulse">{error}</div>}

      <button type="submit" className="btn-primary mt-6 mb-2" disabled={isLoading}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>

      {renderGoogleButton()}
      
      <div className="relative mt-8 pt-4 border-t border-emerald-100 dark:border-slate-700">
        <p className="mb-3 font-medium text-center text-gray-600 dark:text-gray-400 text-sm">Don't have an account?</p>
        <button type="button" onClick={() => { setStep(1); setView('signUp'); setError(null); }} className="btn-tertiary w-full">Sign Up</button>
      </div>
    </form>
  );

  const renderInitialView = () => (
    <div className="flex flex-col items-center justify-center h-full text-center pt-10">
        <LogoIcon className="w-48 h-48 text-emerald-600 mx-auto mb-6 filter drop-shadow-[0_0_20px_rgba(5,150,105,0.4)]" />
        <h1 className="text-4xl font-bold text-emerald-900 dark:text-gray-100">Welcome to NutriCan</h1>
        <p className="text-emerald-700 mt-2 mb-10 dark:text-emerald-400 font-medium">Your personalized nutrition guide.</p>
        <div className="w-full max-w-xs">
             <button onClick={() => { setStep(1); setView('signUp'); setError(null); }} className="btn-primary text-lg mb-4">
                Sign Up
            </button>
            
            <div className="flex items-center justify-center w-full my-5">
                <div className="h-px bg-emerald-200 dark:bg-slate-600 w-full"></div>
                <span className="px-3 text-emerald-700 dark:text-gray-400 text-sm font-bold">OR</span>
                <div className="h-px bg-emerald-200 dark:bg-slate-600 w-full"></div>
            </div>
            
             <button 
                type="button" 
                onClick={handleGoogleSignIn} 
                className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-white font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 mb-4"
                disabled={isLoading}
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Google
            </button>

            <button onClick={() => { setView('signIn'); setError(null); }} className="btn-secondary text-lg mt-4">
                Sign In with Email
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
      {/* Enhanced Back Button Visibility */}
      <button 
        onClick={handleBack} 
        className="absolute top-6 left-6 z-50 p-3 bg-white dark:bg-slate-800 rounded-full text-emerald-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-all shadow-lg border border-gray-200 dark:border-slate-700 active:scale-95"
        aria-label="Go back"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>

      <div key={view + step} className="animate-fade-in pb-16">
        {renderContent()}
      </div>
      
      {/* Ensure guest button is only visible when appropriate and doesn't overlap heavily */}
      {(view === 'initial') && (
       <button onClick={onContinueAsGuest} className="btn-tertiary absolute bottom-8 left-8 right-8 sm:left-1/2 sm:right-auto sm:w-64 sm:-ml-32 w-auto backdrop-blur-sm text-sm py-3 z-10">
        Continue as Guest
      </button>
      )}
    </div>
  );
};

export default AuthScreen;