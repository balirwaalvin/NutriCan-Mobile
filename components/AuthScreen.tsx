import React, { useState } from 'react';
import { UserProfile, CancerType, CancerStage, OtherCondition } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (profile: UserProfile) => void;
  onContinueAsGuest: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    gender: 'Prefer not to say' as UserProfile['gender'],
    cancerType: CancerType.BREAST,
    otherConditions: [] as OtherCondition[],
    cancerStage: CancerStage.EARLY,
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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthSuccess({
      ...formData,
      age: parseInt(formData.age, 10),
    });
  };

  const renderStep1 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 text-center dark:text-gray-100">Create Your Account</h1>
      <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white" required />
      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white">
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
        <option>Prefer not to say</option>
      </select>
      <button type="submit" className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Next</button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleNextStep} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 text-center dark:text-gray-100">Health Profile</h1>
      <label className="font-semibold text-gray-700 dark:text-gray-300">Cancer Type</label>
      <select name="cancerType" value={formData.cancerType} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white">
        {Object.values(CancerType).map(type => <option key={type}>{type}</option>)}
      </select>
      
      <label className="font-semibold text-gray-700 mt-4 block dark:text-gray-300">Other Conditions (if any)</label>
      <div className="space-y-2">
        {Object.values(OtherCondition).map(cond => (
          <label key={cond} className="flex items-center space-x-2 p-3 border rounded-lg dark:border-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={formData.otherConditions.includes(cond)} onChange={() => handleCheckboxChange(cond)} className="h-5 w-5 text-brand-purple focus:ring-brand-purple bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600" />
            <span>{cond}</span>
          </label>
        ))}
      </div>
      <button type="submit" className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Next</button>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <img src="https://picsum.photos/seed/patientprofile/400/300" alt="Patient profile" className="rounded-xl mx-auto"/>
      <h1 className="text-2xl font-bold text-gray-800 text-center dark:text-gray-100">Cancer Stage</h1>
      <select name="cancerStage" value={formData.cancerStage} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white">
        {Object.values(CancerStage).map(stage => <option key={stage}>{stage}</option>)}
      </select>
      <button type="submit" className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4">Complete Profile</button>
    </form>
  );

  const renderContent = () => {
    switch(step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep1();
    }
  }

  return (
    <div className="p-8 flex flex-col justify-center min-h-screen bg-white dark:bg-gray-900">
      <div key={step} className="animate-fade-in">
        {renderContent()}
      </div>
       <button onClick={onContinueAsGuest} className="text-center text-brand-purple mt-6 font-semibold">
        Continue as Guest
      </button>
    </div>
  );
};

export default AuthScreen;