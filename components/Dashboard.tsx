import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { UserProfile, DashboardPage, WeeklyMealPlan, FoodSafetyStatus, FoodSafetyResult, Meal, NutrientInfo, SymptomType, RecommendedFood, JournalEntry, LoggedMeal, DoctorProfile, ChatMessage, CancerType, CancerStage, TreatmentStage, OtherCondition } from '../types';
import { HomeIcon, ChartIcon, BookIcon, PremiumIcon, UserIcon, SearchIcon, LogoIcon, ProteinIcon, CarbsIcon, BalancedIcon, BowlIcon, PlusIcon, NauseaIcon, MouthSoreIcon, BellIcon, ChatBubbleIcon, VideoCallIcon, ShareIcon, MicIcon, BroadcastIcon, ChevronLeftIcon, FatigueIcon, DownloadIcon } from './Icons';
import { checkFoodSafety, generateMealPlan, swapMeal, getNutrientInfo, getSymptomTips, getDoctorChatResponse } from '../services/geminiService';
import { db, auth } from '../services/db';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { ThemeContext } from '../contexts/ThemeContext';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from "@google/genai";

// --- Shared Props Interface ---
interface DashboardProps {
  userProfile: UserProfile;
  onLogout: () => void;
}

// --- Constants ---
const CONDITION_LEVELS: Record<string, string[]> = {
  [OtherCondition.DIABETES]: ['Type 1', 'Type 2', 'Prediabetes', 'Gestational'],
  [OtherCondition.HYPERTENSION]: ['Elevated', 'Stage 1', 'Stage 2', 'Hypertensive Crisis'],
  [OtherCondition.HYPOTENSION]: ['Mild', 'Chronic', 'Orthostatic', 'Severe'],
};

// --- Audio Encoding/Decoding Utilities ---
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Reusable UI Components ---

const Modal: React.FC<{ children: React.ReactNode; closeModal: () => void; fullScreen?: boolean }> = ({ children, closeModal, fullScreen }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 animate-fade-in" onClick={closeModal}>
    <div className={`bg-white dark:bg-emerald-950 w-full rounded-[3rem] relative shadow-2xl animate-fade-in-up border-4 border-emerald-500/20 overflow-hidden flex flex-col ${fullScreen ? 'h-[95vh] max-w-4xl' : 'max-h-[90vh] max-w-lg'}`} onClick={e => e.stopPropagation()}>
      <button onClick={closeModal} className="absolute top-6 right-6 p-3 glass-panel rounded-full text-emerald-900 dark:text-white hover:scale-110 transition-transform z-50 shadow-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <div className={`flex-grow overflow-y-auto ${fullScreen ? 'p-0' : 'p-8 pt-10'}`}>
        {children}
      </div>
    </div>
  </div>
);

const BottomNavBar: React.FC<{ activePage: DashboardPage; onNavigate: (page: DashboardPage) => void }> = ({ activePage, onNavigate }) => {
  const navItems = [
    { page: 'home' as DashboardPage, icon: HomeIcon, label: 'Home' },
    { page: 'tracker' as DashboardPage, icon: ChartIcon, label: 'Tracker' },
    { page: 'live' as DashboardPage, icon: BroadcastIcon, label: 'Live' },
    { page: 'library' as DashboardPage, icon: BookIcon, label: 'Library' },
    { page: 'profile' as DashboardPage, icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full sm:max-w-md md:max-w-lg mx-auto bg-white/80 backdrop-blur-2xl border-t border-white/20 flex justify-around p-3 pb-8 dark:bg-emerald-950/60 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] rounded-t-[3rem]">
      {navItems.map(item => {
          const isActive = activePage === item.page;
          return (
            <button key={item.page} onClick={() => onNavigate(item.page)} className="flex flex-col items-center justify-center w-14 transition-all transform active:scale-90 group">
              <div className={`relative p-3 rounded-[1.2rem] transition-all duration-500 ${isActive ? 'bg-brand-green shadow-glow-primary scale-110' : 'bg-transparent'}`}>
                <item.icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-white' : 'text-emerald-800/40 dark:text-emerald-300/30'}`} />
              </div>
              <span className={`text-[10px] mt-2 font-black transition-all duration-300 uppercase tracking-tighter ${isActive ? 'text-brand-green dark:text-brand-emerald' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}>{item.label}</span>
            </button>
          )
      })}
    </div>
  );
};

const EmergencyButton: React.FC<{ activePage: DashboardPage }> = ({ activePage }) => {
  const [showModal, setShowModal] = useState(false);
  if (activePage === 'tracker') return null;
  return (
    <>
      <div className="fixed bottom-32 right-6 z-50">
        <button onClick={() => setShowModal(true)} className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-110 active:scale-95 transition-all group overflow-hidden">
            <span className="font-extrabold text-xs relative z-10">SOS</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="glass-panel p-8 rounded-[3rem] shadow-2xl text-center max-w-xs w-full animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h2 className="text-2xl font-black mb-2 text-red-600 dark:text-red-400">Emergency</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Direct contact with urgent care.</p>
            <div className="space-y-4">
              <div className="card-button-wrapper !bg-transparent border-none p-0">
                <button className="btn-primary w-full !bg-red-600 shadow-red-500/30 font-black">Call Hospital</button>
              </div>
              <div className="card-button-wrapper !bg-transparent border-none p-0">
                <button className="btn-secondary w-full font-black">Caregiver SOS</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- Modals ---

const PaymentModal: React.FC<{ onPaymentSuccess: () => void; closeModal: () => void }> = ({ onPaymentSuccess, closeModal }) => {
    const [step, setStep] = useState<'method' | 'processing' | 'success'>('method');
    const [selectedProvider, setSelectedProvider] = useState<'MTN' | 'Airtel' | null>(null);

    const handlePay = (provider: 'MTN' | 'Airtel') => {
        setSelectedProvider(provider);
        setStep('processing');
        setTimeout(() => setStep('success'), 3000);
    };

    const handleFinish = () => {
        onPaymentSuccess();
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-emerald-950/98 backdrop-blur-3xl z-[200] flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-emerald-900/40 max-w-sm w-full rounded-[3.5rem] p-10 text-center shadow-2xl relative border-b-8 border-brand-green overflow-hidden glass-panel">
                <button onClick={closeModal} className="absolute top-8 right-8 p-2 text-emerald-800 dark:text-emerald-100 hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {step === 'method' && (
                  <div className="animate-fade-in">
                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-primary">
                        <PremiumIcon className="w-10 h-10 text-brand-green" />
                    </div>
                    <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tighter">NutriCan Pro</h2>
                    <p className="text-gray-500 mb-8 font-bold text-sm">Upgrade for 15,000 UGX / Month</p>
                    
                    <div className="space-y-4 mb-8">
                        <div className="card-button-wrapper">
                            <button onClick={() => handlePay('MTN')} className="w-full flex items-center justify-between p-4 font-black text-emerald-950 dark:text-white group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-mtn-yellow rounded-xl shadow-lg"></div>
                                    <span>MTN MoMo</span>
                                </div>
                                <ChevronLeftIcon className="w-5 h-5 rotate-180 opacity-30 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                        <div className="card-button-wrapper">
                            <button onClick={() => handlePay('Airtel')} className="w-full flex items-center justify-between p-4 font-black text-emerald-950 dark:text-white group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-airtel-red rounded-xl shadow-lg"></div>
                                    <span>Airtel Money</span>
                                </div>
                                <ChevronLeftIcon className="w-5 h-5 rotate-180 opacity-30 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                  </div>
                )}

                {step === 'processing' && (
                  <div className="py-10 animate-fade-in flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-3xl mb-8 flex items-center justify-center shadow-2xl animate-pulse ${selectedProvider === 'MTN' ? 'bg-mtn-yellow' : 'bg-airtel-red'}`}>
                        <LogoIcon className="w-12 h-12 invert brightness-0" />
                    </div>
                    <p className="font-black text-xl text-emerald-950 dark:text-white mb-2">Processing Payment</p>
                    <p className="text-gray-500 font-bold text-sm">Please check your phone for a MoMo prompt...</p>
                    <div className="mt-8 flex gap-2">
                        <div className="w-3 h-3 bg-brand-green rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-3 h-3 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}

                {step === 'success' && (
                  <div className="animate-fade-in py-6">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-glow-primary">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2">Upgrade Success!</h2>
                    <p className="text-gray-500 mb-10 font-bold">Welcome to NutriCan Premium.</p>
                    <div className="card-button-wrapper">
                        <button onClick={handleFinish} className="btn-primary w-full shadow-glow-large uppercase tracking-widest text-sm">Continue</button>
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-Screens ---

const EditProfileForm: React.FC<{ user: UserProfile; onSave: (profile: UserProfile) => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<UserProfile>(user);
    const [isLoading, setIsLoading] = useState(false);
    
    // State for local condition handling (parsed from user profile)
    const [conditionsState, setConditionsState] = useState<{selected: string[], details: Record<string, string>}>({ selected: [], details: {} });

    // Initialize conditions state from the user profile string[]
    useEffect(() => {
        const selected: string[] = [];
        const details: Record<string, string> = {};
        
        user.otherConditions.forEach(c => {
            // Check if string contains detail like "Diabetes (Type 1)"
            const match = c.match(/^(.+) \((.+)\)$/);
            if (match) {
                const condition = match[1];
                const detail = match[2];
                selected.push(condition);
                details[condition] = detail;
            } else {
                selected.push(c);
                // Set default detail if applicable and not present
                if (CONDITION_LEVELS[c]) details[c] = CONDITION_LEVELS[c][0];
            }
        });
        setConditionsState({ selected, details });
    }, [user]);

    // Update formData whenever conditionsState changes
    useEffect(() => {
        const formattedConditions = conditionsState.selected.map(c => 
            conditionsState.details[c] ? `${c} (${conditionsState.details[c]})` : c
        );
        setFormData(prev => ({ ...prev, otherConditions: formattedConditions }));
    }, [conditionsState]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'age' || name === 'height' || name === 'weight') ? Number(value) : value
        }));
    };

    const handleTreatmentChange = (stage: TreatmentStage) => {
        setFormData(prev => {
            const stages = prev.treatmentStages.includes(stage)
                ? prev.treatmentStages.filter(s => s !== stage)
                : [...prev.treatmentStages, stage];
            return { ...prev, treatmentStages: stages };
        });
    };
    
    const handleConditionChange = (condition: string) => {
        setConditionsState(prev => {
            const isSelected = prev.selected.includes(condition);
            let newSelected = isSelected ? prev.selected.filter(c => c !== condition) : [...prev.selected, condition];
            let newDetails = { ...prev.details };
            
            if (!isSelected && CONDITION_LEVELS[condition]) {
                newDetails[condition] = CONDITION_LEVELS[condition][0];
            } else if (isSelected) {
                delete newDetails[condition];
            }
            
            return { selected: newSelected, details: newDetails };
        });
    };

    const handleDetailChange = (condition: string, detail: string) => {
        setConditionsState(prev => ({
            ...prev,
            details: { ...prev.details, [condition]: detail }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Update Firestore
            await db.updateProfile(formData);
            // Update local state in Dashboard
            onSave(formData);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full p-4 glass-panel rounded-2xl border-2 border-emerald-500/10 focus:border-brand-green outline-none font-bold text-emerald-950 dark:text-white bg-white/50 dark:bg-emerald-900/20";
    const labelClass = "text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest block mb-2";

    return (
        <div className="pb-4">
             <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tighter text-center">Account Settings</h2>
             <p className="text-gray-500 mb-8 font-medium text-center text-sm">Update your biometrics for better AI plans.</p>
             
             <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className={labelClass}>Full Name</label>
                    <input name="name" type="text" value={formData.name} onChange={handleChange} className={inputClass} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Age</label>
                        <input name="age" type="number" value={formData.age} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Height (cm)</label>
                        <input name="height" type="number" value={formData.height} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Weight (kg)</label>
                        <input name="weight" type="number" value={formData.weight} onChange={handleChange} className={inputClass} />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Diagnosis</label>
                    <select name="cancerType" value={formData.cancerType} onChange={handleChange} className={inputClass}>
                        {Object.values(CancerType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Current Stage</label>
                    <select name="cancerStage" value={formData.cancerStage} onChange={handleChange} className={inputClass}>
                        {Object.values(CancerStage).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Other Conditions</label>
                    <div className="space-y-3">
                        {Object.values(OtherCondition).map(condition => {
                             const isChecked = conditionsState.selected.includes(condition);
                             return (
                                <div key={condition} className={`p-4 rounded-2xl border-2 transition-all ${isChecked ? 'border-brand-green bg-brand-green/10' : 'border-emerald-500/10 bg-white/50 dark:bg-emerald-900/20'}`}>
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => handleConditionChange(condition)}>
                                        <span className="font-bold text-sm text-emerald-950 dark:text-white">{condition}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isChecked ? 'border-brand-green bg-brand-green' : 'border-gray-300'}`}>
                                            {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    </div>
                                    {isChecked && CONDITION_LEVELS[condition] && (
                                        <div className="mt-3 pl-4 animate-fade-in">
                                            <select 
                                                value={conditionsState.details[condition] || CONDITION_LEVELS[condition][0]} 
                                                onChange={(e) => handleDetailChange(condition, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full p-2 bg-white/50 dark:bg-black/20 rounded-xl text-xs font-bold outline-none text-emerald-900 dark:text-white border border-emerald-500/20"
                                            >
                                                {CONDITION_LEVELS[condition].map(level => (
                                                    <option key={level} value={level}>{level}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                             );
                        })}
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Treatment Phase</label>
                    <div className="space-y-3">
                        {Object.values(TreatmentStage).map(stage => (
                            <div key={stage} onClick={() => handleTreatmentChange(stage)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${formData.treatmentStages.includes(stage) ? 'border-brand-green bg-brand-green/10' : 'border-emerald-500/10 bg-white/50 dark:bg-emerald-900/20'}`}>
                                <span className="font-bold text-sm text-emerald-950 dark:text-white">{stage}</span>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.treatmentStages.includes(stage) ? 'border-brand-green bg-brand-green' : 'border-gray-300'}`}>
                                    {formData.treatmentStages.includes(stage) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <button type="button" onClick={onCancel} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-gray-500 bg-gray-100 dark:bg-white/5 rounded-2xl">Cancel</button>
                    <button type="submit" disabled={isLoading} className="flex-[2] btn-primary shadow-glow-primary">
                        {isLoading ? 'Saving Changes...' : 'Update Profile'}
                    </button>
                </div>
             </form>
        </div>
    );
};

const SymptomTipsScreen: React.FC = () => {
    const [selectedSymptom, setSelectedSymptom] = useState<SymptomType | null>(null);
    const [tips, setTips] = useState<RecommendedFood[] | null>(null);
    const [loading, setLoading] = useState(false);
    const handleSymptomSelect = async (symptom: SymptomType) => {
        setSelectedSymptom(symptom);
        setLoading(true);
        const result = await getSymptomTips(symptom);
        setTips(result);
        setLoading(false);
    };
    return (
        <div className="p-4 pb-16 min-h-[60vh]">
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tighter">Symptom Hub</h2>
            <p className="text-gray-500 mb-8 font-medium">Dietary comfort for recovery.</p>
            {!selectedSymptom ? (
                <div className="grid grid-cols-2 gap-5">
                    {Object.values(SymptomType).map((symptom) => (
                        <div key={symptom} className="card-button-wrapper">
                          <button onClick={() => handleSymptomSelect(symptom)} className="w-full h-full p-6 flex flex-col items-center gap-3 text-center transition-all active:scale-95 group">
                              <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-brand-green group-hover:rotate-12 transition-transform">
                                  <NauseaIcon className="w-7 h-7" />
                              </div>
                              <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-tighter">{symptom}</span>
                          </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="animate-fade-in">
                    <button onClick={() => setSelectedSymptom(null)} className="flex items-center gap-2 text-brand-green font-black mb-8">
                        <ChevronLeftIcon className="w-5 h-5" /> Back to list
                    </button>
                    {loading ? (
                        <div className="text-center py-20 animate-pulse"><LogoIcon className="animate-spin w-14 h-14 mx-auto text-brand-green" /></div>
                    ) : (
                        <div className="space-y-6">
                            {tips?.map((tip, idx) => (
                                <div key={idx} className="glass-panel rounded-[2.5rem] overflow-hidden flex gap-5 p-5 items-center border border-white/40 shadow-xl">
                                    <img src={tip.photoUrl} alt={tip.name} className="w-24 h-24 object-cover rounded-3xl shadow-md" />
                                    <div className="flex-grow">
                                        <p className="font-black text-emerald-950 dark:text-white text-base mb-1">{tip.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-emerald-100/60 leading-relaxed font-medium">{tip.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const RemindersScreen: React.FC = () => {
    // State to manage reminders
    const [activeReminders, setActiveReminders] = useState([
        { id: 1, title: 'Hydration', time: 'Every 2 hours', icon: BowlIcon, color: 'text-sky-500', type: 'water' },
        { id: 2, title: 'Vitamin Check', time: '9:00 AM', icon: BellIcon, color: 'text-rose-500', type: 'meds' },
        { id: 3, title: 'Evening Walk', time: '5:30 PM', icon: HomeIcon, color: 'text-emerald-500', type: 'walk' },
    ]);

    const suggestions = [
        { title: 'Drink Water', time: 'Hourly', icon: BowlIcon, color: 'text-sky-500', type: 'water' },
        { title: 'Take Meds', time: '8:00 AM', icon: BellIcon, color: 'text-rose-500', type: 'meds' },
        { title: 'Short Walk', time: '6:00 PM', icon: HomeIcon, color: 'text-emerald-500', type: 'walk' },
        { title: 'Lunch Time', time: '1:00 PM', icon: BowlIcon, color: 'text-amber-500', type: 'food' },
    ];

    const addReminder = (suggestion: any) => {
        // Logic to add to activeReminders with a unique ID
        setActiveReminders([...activeReminders, { ...suggestion, id: Date.now() }]);
    };

    const removeReminder = (id: number) => {
        setActiveReminders(activeReminders.filter(r => r.id !== id));
    };

    return (
        <div className="p-4 pb-16">
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tighter">My Alerts</h2>
            <p className="text-gray-500 mb-8 font-medium">Staying on schedule.</p>
            
            {/* Active Reminders List */}
            <div className="space-y-4 mb-10">
                {activeReminders.map((rem) => (
                    <div key={rem.id} className="glass-panel p-5 rounded-[2rem] flex items-center justify-between gap-4 shadow-lg border-l-4 border-brand-green animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 bg-white dark:bg-emerald-900/30 rounded-2xl shadow-inner ${rem.color}`}>
                                <rem.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black text-base text-emerald-950 dark:text-white">{rem.title}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rem.time}</p>
                            </div>
                        </div>
                        <button onClick={() => removeReminder(rem.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                ))}
                {activeReminders.length === 0 && (
                    <div className="text-center py-8 opacity-40">
                        <p className="font-black italic">No active alerts.</p>
                    </div>
                )}
            </div>

            <h3 className="text-xs font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest mb-4 px-2">Quick Add Reminders</h3>
            <div className="grid grid-cols-2 gap-4">
                {suggestions.map((sug, i) => (
                    <div key={i} className="card-button-wrapper">
                        <button onClick={() => addReminder(sug)} className="w-full p-4 flex flex-col items-center gap-2 active:scale-95 transition-all">
                            <div className={`p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl ${sug.color}`}>
                                <sug.icon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-900 dark:text-white">{sug.title}</span>
                            <div className="bg-brand-green text-white rounded-full p-1 shadow-lg mt-1">
                                <PlusIcon className="w-4 h-4" />
                            </div>
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="card-button-wrapper mt-8">
              <button className="btn-primary w-full shadow-glow-primary">Create Custom Alert</button>
            </div>
        </div>
    );
};

const MealPlanScreen: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState((new Date().getDay() + 6) % 7);
  const [swappingState, setSwappingState] = useState<{dayIndex: number, mealType: string} | null>(null);
  
  // Re-fetch when userProfile changes to ensure gradual change based on new suffering/condition
  const fetchMealPlan = useCallback(async () => {
    setLoading(true);
    const plan = await generateMealPlan(userProfile);
    setMealPlan(plan);
    setLoading(false);
  }, [userProfile]); // Dependent on userProfile

  useEffect(() => { fetchMealPlan(); }, [fetchMealPlan]);
  
  const handleSwapMeal = async (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!mealPlan) return;
    setSwappingState({ dayIndex, mealType });
    const mealToSwap = mealPlan[dayIndex][mealType];
    const newMeal = await swapMeal(userProfile, mealToSwap, mealPlan[dayIndex].day, mealType);
    if (newMeal && mealPlan) {
      const updatedPlan = [...mealPlan];
      updatedPlan[dayIndex] = { ...updatedPlan[dayIndex], [mealType]: newMeal };
      setMealPlan(updatedPlan);
    }
    setSwappingState(null);
  };
  if (loading) return <div className="p-20 text-center flex flex-col items-center justify-center h-full"><LogoIcon className="animate-spin h-16 w-16 text-brand-green mb-4" /><p className="font-black text-emerald-900 dark:text-emerald-300">Building your menu...</p></div>;
  if (!mealPlan) return <div className="p-10 text-center">Failed to load plan.</div>;
  const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="p-4 pb-20">
      <h2 className="text-3xl font-black mb-8 text-emerald-950 dark:text-white tracking-tight">Weekly Plan</h2>
      <div className="flex justify-between gap-2 mb-10 bg-emerald-100/50 dark:bg-emerald-900/20 p-2 rounded-[2.5rem] overflow-x-auto no-scrollbar shadow-inner border border-emerald-500/10">
        {dayShortNames.map((day, index) => (
          <button key={day} onClick={() => setSelectedDayIndex(index)} className={`px-5 py-3 rounded-2xl font-black text-[11px] transition-all duration-300 ${selectedDayIndex === index ? 'bg-brand-green text-white shadow-glow-primary scale-105' : 'text-emerald-900/40 dark:text-white/40'}`}>
            {day}
          </button>
        ))}
      </div>
      <div key={selectedDayIndex} className="space-y-10 animate-fade-in">
        {(['breakfast', 'lunch', 'dinner'] as const).map((type) => (
          <MealCard key={type} meal={mealPlan[selectedDayIndex][type]} title={type.charAt(0).toUpperCase() + type.slice(1)} delay={100} onSwap={() => handleSwapMeal(selectedDayIndex, type)} isSwapping={swappingState?.dayIndex === selectedDayIndex && swappingState?.mealType === type} />
        ))}
      </div>
    </div>
  );
};

const MealCard: React.FC<{ meal: Meal, title: string, delay: number, onSwap: () => void, isSwapping: boolean }> = ({ meal, title, delay, onSwap, isSwapping }) => {
    return (
        <div className="glass-panel rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up group relative border border-white/40" style={{ animationDelay: `${delay}ms` }}>
            <div className="relative h-48 overflow-hidden">
                <img src={meal.photoUrl} alt={meal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 to-transparent"></div>
                {isSwapping && <div className="absolute inset-0 glass-panel flex items-center justify-center"><LogoIcon className="animate-spin h-14 w-14 text-brand-green" /></div>}
                <div className="absolute bottom-6 left-8 right-8">
                  <span className="text-[9px] font-black uppercase text-brand-green bg-white px-3 py-1 rounded-full mb-2 inline-block shadow-lg tracking-widest">{title}</span>
                  <p className="font-black text-2xl text-white drop-shadow-2xl">{meal.name}</p>
                </div>
            </div>
            <div className="p-8">
                <p className="text-gray-600 text-sm mb-6 dark:text-emerald-100/70 leading-relaxed font-bold">{meal.description}</p>
                <div className="mb-8 p-5 bg-emerald-50 dark:bg-emerald-900/30 rounded-[2rem] border-l-4 border-brand-green shadow-inner">
                    <p className="text-xs text-emerald-900 dark:text-emerald-100 italic font-medium leading-relaxed">“{meal.reason}”</p>
                </div>
                <div className="card-button-wrapper">
                  <button onClick={onSwap} disabled={isSwapping} className="btn-primary w-full !text-base shadow-glow-primary">Swap for something else</button>
                </div>
            </div>
        </div>
    );
};

const FoodSafetyCheckerScreen: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    const [food, setFood] = useState('');
    const [result, setResult] = useState<FoodSafetyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [showIntro, setShowIntro] = useState(true);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!food.trim()) return;
        setLoading(true);
        const safetyResult = await checkFoodSafety(food, userProfile);
        setResult(safetyResult);
        setLoading(false);
    };
    return (
        <div className="p-4 pb-20 page-transition relative min-h-[500px]">
            {showIntro && (
                <div className="absolute inset-0 z-20 bg-white/95 dark:bg-emerald-950/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mb-6 shadow-glow-primary">
                        <SearchIcon className="w-12 h-12 text-brand-green" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-950 dark:text-white mb-3">Food Safety Checker</h3>
                    <p className="text-gray-500 dark:text-emerald-100/70 font-bold text-sm mb-8 leading-relaxed">
                        Unsure about a meal? Type in any food name to instantly see if it's safe for your 
                        <span className="text-brand-green"> {userProfile.cancerType}</span> recovery journey.
                    </p>
                    <div className="card-button-wrapper w-full">
                        <button onClick={() => setShowIntro(false)} className="btn-primary w-full shadow-glow-primary">
                            Got it, let's check!
                        </button>
                    </div>
                </div>
            )}
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tighter">Food Scanner</h2>
            <p className="text-gray-500 mb-10 font-medium">Safe nutrition, better health.</p>
            <form onSubmit={handleSearch} className="relative mb-12">
                <input type="text" value={food} onChange={(e) => setFood(e.target.value)} placeholder="Type meal name..." className="w-full pl-8 pr-20 py-6 glass-panel rounded-[2.5rem] text-lg font-black outline-none focus:ring-4 focus:ring-brand-green/20 transition-all shadow-inner border-2 border-white/50" />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-green p-4 rounded-full text-white shadow-glow-primary active:scale-90 transition-all">
                    <SearchIcon className="w-6 h-6"/>
                </button>
            </form>
            {loading && <div className="text-center py-20 animate-pulse"><LogoIcon className="animate-spin h-16 w-16 mx-auto text-brand-green" /></div>}
            {result && (
                <div className={`p-8 rounded-[3rem] shadow-2xl animate-fade-in-up border-b-8 ${result.status === FoodSafetyStatus.SAFE ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20' : 'bg-red-50 border-red-500 dark:bg-red-900/20'}`}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`p-5 rounded-[2rem] mb-6 ${result.status === FoodSafetyStatus.SAFE ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-red-500 shadow-red-500/30'} shadow-xl`}>
                           {result.status === FoodSafetyStatus.SAFE ? <BowlIcon className="w-10 h-10 text-white" /> : <LogoIcon className="w-10 h-10 text-white" />}
                        </div>
                        <h3 className="text-3xl font-black mb-4 capitalize text-emerald-950 dark:text-white">{food}</h3>
                        <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 ${result.status === FoodSafetyStatus.SAFE ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {result.status}
                        </div>
                        <p className="text-gray-700 dark:text-emerald-100 font-bold text-lg leading-relaxed">{result.reason}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Tracker Screen Implementation ---

const TrackerScreen: React.FC<{ userProfile: UserProfile, setModal: (content: React.ReactNode) => void }> = ({ userProfile, setModal }) => {
    const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);
    const [journalData, setJournalData] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [meals, journals] = await Promise.all([db.getMealLogs(), db.getJournalEntries()]);
            setLoggedMeals(meals || []);
            setJournalData(journals || []);
        } catch (error) {
            console.error("Error fetching tracker data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const chartData = useMemo(() => {
        const dailyStats: Record<string, { calories: number, energy: number | null }> = {};

        // Aggregate Calories from Meals
        loggedMeals.forEach(meal => {
            const date = new Date(meal.timestamp).toLocaleDateString();
            if (!dailyStats[date]) dailyStats[date] = { calories: 0, energy: null };
            dailyStats[date].calories += meal.nutrients.calories;
        });

        // Aggregate Energy from Journal
        journalData.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            if (!dailyStats[date]) dailyStats[date] = { calories: 0, energy: 0 };
            dailyStats[date].energy = entry.energy; 
        });

        // Fill in last 7 days even if empty to make chart look good
        const today = new Date();
        for(let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString();
            if (!dailyStats[dateStr]) dailyStats[dateStr] = { calories: 0, energy: 0 };
        }

        return Object.entries(dailyStats)
            .map(([date, stats]) => ({
                name: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
                fullDate: new Date(date),
                calories: stats.calories,
                energy: stats.energy || 0
            }))
            .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
            .slice(-7); 
    }, [loggedMeals, journalData]);

    const todaysCalories = useMemo(() => {
        const todayStr = new Date().toLocaleDateString();
        const todaysLog = loggedMeals.filter(m => new Date(m.timestamp).toLocaleDateString() === todayStr);
        return todaysLog.reduce((acc, curr) => acc + curr.nutrients.calories, 0);
    }, [loggedMeals]);

    const openLogMeal = () => {
        setModal(<LogMealForm onComplete={() => { setModal(null); fetchData(); }} />);
    };

    const openCheckIn = () => {
        setModal(<CheckInForm onComplete={() => { setModal(null); fetchData(); }} userProfile={userProfile} />);
    };

    if (loading) {
        return (
            <div className="p-10 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <ChartIcon className="w-16 h-16 text-emerald-300 mb-4 animate-pulse"/>
                <p className="font-black text-emerald-900 dark:text-white uppercase tracking-widest text-xs">Syncing Biometrics...</p>
            </div>
        );
    }

    return (
        <div className="p-6 pb-40 animate-fade-in">
            <h2 className="text-3xl font-black mb-8 text-emerald-950 dark:text-white tracking-tight">Nutrient Tracker</h2>
            
            {/* Today's Summary Card */}
            <div className="glass-panel p-6 rounded-[2.5rem] mb-10 flex items-center justify-between border-l-8 border-brand-green shadow-xl">
                <div>
                    <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Today's Intake</p>
                    <p className="text-4xl font-black text-emerald-950 dark:text-white">{todaysCalories} <span className="text-lg font-bold text-brand-green">kcal</span></p>
                </div>
                <div className="p-4 bg-brand-green/10 rounded-full">
                    <ChartIcon className="w-8 h-8 text-brand-green" />
                </div>
            </div>

            {/* Combined Chart */}
            <div className="glass-panel p-6 rounded-[3.5rem] shadow-2xl border-b-8 border-brand-green mb-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 blur-3xl rounded-full"></div>
                <h3 className="text-[10px] font-black text-emerald-900/40 dark:text-white/30 uppercase tracking-[0.3em] mb-8 text-center">Calories vs Energy</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.3}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 800 }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#F59E0B' }} hide />
                            <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                                labelStyle={{ fontWeight: 800, color: '#064E3B', marginBottom: '0.5rem' }}
                            />
                            <Bar yAxisId="left" dataKey="calories" fill="url(#barGradient)" radius={[10, 10, 10, 10]} barSize={20} />
                            <Line yAxisId="right" type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-brand-green"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Calories</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Energy Level</span>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-5 mb-12">
                <div className="card-button-wrapper">
                    <button onClick={openLogMeal} className="w-full py-6 rounded-3xl flex flex-col items-center gap-2 bg-brand-green text-white shadow-glow-primary active:scale-95 transition-all">
                        <PlusIcon className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Log Meal</span>
                    </button>
                </div>
                <div className="card-button-wrapper">
                    <button onClick={openCheckIn} className="w-full py-6 rounded-3xl flex flex-col items-center gap-2 bg-white dark:bg-emerald-900/30 text-emerald-600 font-black border-2 border-emerald-500/10 active:scale-95 transition-all">
                        <BookIcon className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Check-In</span>
                    </button>
                </div>
            </div>

            <h3 className="text-[11px] font-black mb-6 text-emerald-900/60 dark:text-white/30 uppercase tracking-[0.2em] px-2">Recent Logs</h3>
            <div className="space-y-4">
                {loggedMeals.length > 0 ? loggedMeals.map(meal => (
                    <div key={meal.id} className="glass-panel p-6 rounded-[2.5rem] flex items-center gap-5 border-l-4 border-emerald-500 transition-all hover:translate-x-1 shadow-md">
                        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-brand-green shadow-inner">
                          <BowlIcon className="w-7 h-7" />
                        </div>
                        <div className="flex-grow">
                          <p className="font-black text-emerald-950 dark:text-white text-lg leading-tight capitalize">{meal.name}</p>
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1">{new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <p className="text-brand-green font-black text-lg">{meal.nutrients.calories}<span className="text-[10px] ml-1">kcal</span></p>
                    </div>
                )) : (
                    <div className="text-center py-10 opacity-30">
                        <p className="font-black italic">No history recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const LogMealForm: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [mealName, setMealName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mealName.trim()) return;
        setIsLoading(true);
        try {
            const nutrients = await getNutrientInfo(mealName);
            if (nutrients) {
                await db.addMealLog({ name: mealName, nutrients });
                onComplete();
            } else {
                alert("Could not calculate nutrition. Please try again.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-2">
            <h3 className="text-2xl font-black text-emerald-950 dark:text-white mb-2">Log a Meal</h3>
            <p className="text-gray-500 text-sm mb-8 font-bold">What did you eat? AI will calculate the nutrition.</p>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="relative">
                    <input 
                        type="text" 
                        value={mealName} 
                        onChange={(e) => setMealName(e.target.value)}
                        placeholder="e.g. Rice and Beans"
                        className="w-full p-6 glass-panel rounded-3xl border-2 border-emerald-500/20 focus:border-brand-green outline-none font-black text-lg"
                        autoFocus
                    />
                </div>
                <div className="card-button-wrapper">
                    <button type="submit" disabled={isLoading} className="btn-primary w-full shadow-glow-primary">
                        {isLoading ? 'Estimating Calories...' : 'Save Meal Log'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const CheckInForm: React.FC<{ onComplete: () => void, userProfile: UserProfile }> = ({ onComplete, userProfile }) => {
    const [energy, setEnergy] = useState(7);
    const [weight, setWeight] = useState(userProfile.weight.toString());
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await db.addJournalEntry({
                energy,
                weight: parseFloat(weight),
                notes
            });
            onComplete();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-2">
            <h3 className="text-2xl font-black text-emerald-950 dark:text-white mb-2">Daily Check-In</h3>
            <p className="text-gray-500 text-sm mb-8 font-bold">Track your wellness trends over time.</p>
            <form onSubmit={handleSubmit} className="space-y-10">
                <div>
                    <label className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest block mb-4">Energy Level ({energy}/10)</label>
                    <div className="flex items-center gap-6">
                        <FatigueIcon className={`w-8 h-8 ${energy < 4 ? 'text-rose-500' : 'text-emerald-500/20'}`} />
                        <input 
                            type="range" min="1" max="10" 
                            value={energy} 
                            onChange={(e) => setEnergy(parseInt(e.target.value))} 
                            className="flex-grow accent-brand-green h-2 bg-emerald-100 rounded-full"
                        />
                        <LogoIcon className={`w-8 h-8 ${energy > 7 ? 'text-brand-green' : 'text-emerald-500/20'}`} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest block mb-3">Current Weight (kg)</label>
                    <input 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full p-5 glass-panel rounded-2xl border-2 border-emerald-500/20 focus:border-brand-green outline-none font-black text-xl text-center"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest block mb-3">Wellness Notes</label>
                    <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How are you feeling today?"
                        className="w-full p-5 glass-panel rounded-2xl border-2 border-emerald-500/20 focus:border-brand-green outline-none font-bold text-sm min-h-[100px]"
                    />
                </div>
                <div className="card-button-wrapper">
                    <button type="submit" disabled={isLoading} className="btn-primary w-full shadow-glow-primary">
                        {isLoading ? 'Logging Health Data...' : 'Submit Check-In'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const LibraryScreen: React.FC = () => {
    const resources = [
        { title: 'Nutritional Support Basics', category: 'Recovery', readTime: '5 min', icon: BowlIcon, color: 'text-emerald-500' },
        { title: 'Hydrating During Treatment', category: 'Wellness', readTime: '4 min', icon: HomeIcon, color: 'text-sky-500' },
        { title: 'Top Local Superfoods Guide', category: 'Diet', readTime: '7 min', icon: ProteinIcon, color: 'text-amber-500' },
        { title: 'Mindful Eating Strategies', category: 'Mindset', readTime: '6 min', icon: UserIcon, color: 'text-violet-500' },
    ];

    const handleDownload = (title: string) => {
        // Simulated download functionality
        alert(`Downloading resource: ${title}`);
    };

    return (
        <div className="p-6 pb-40 animate-fade-in">
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tighter">Resources</h2>
            <p className="text-gray-500 mb-10 font-medium">Knowledge for empowerment.</p>
            <div className="space-y-6">
                {resources.map((res, i) => (
                    <div key={i} className="card-button-wrapper">
                      <div className="w-full p-6 flex justify-between items-center group text-left">
                          <div className="flex gap-5 items-center flex-grow">
                            <div className={`p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-[1.5rem] ${res.color} group-hover:rotate-12 transition-transform shadow-inner`}>
                              <res.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase text-brand-green tracking-widest bg-brand-green/10 px-2 py-0.5 rounded-md mb-2 inline-block">#{res.category}</span>
                                <p className="font-black text-emerald-950 dark:text-white text-lg leading-tight">{res.title}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{res.readTime} reading time</p>
                            </div>
                          </div>
                          <button onClick={() => handleDownload(res.title)} className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-md active:scale-90 ml-2">
                            <DownloadIcon className="w-5 h-5" />
                          </button>
                      </div>
                    </div>
                ))}
            </div>
            <div className="mt-12 p-8 glass-panel rounded-[3rem] bg-brand-green shadow-glow-large text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <p className="text-white font-black text-xl mb-2">Need Custom Advice?</p>
                <p className="text-emerald-100/80 text-sm font-bold mb-6 px-4">Contact our specialists directly via the Live portal.</p>
                <div className="inline-block px-8 py-3 bg-white text-brand-green rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Contact Experts</div>
            </div>
        </div>
    );
};

// --- Live Portal Sections with Gemini Live ---

const LiveScreen: React.FC<{ userProfile: UserProfile; onUpgradeRequest: () => void }> = ({ userProfile, onUpgradeRequest }) => {
    const [modality, setModality] = useState<'audio' | 'video'>('audio');
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isModelSpeaking, setIsModelSpeaking] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<number | null>(null);

    const stopSession = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (frameIntervalRef.current) {
            window.clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }
        for (const source of sourcesRef.current) {
            try { source.stop(); } catch(e) {}
        }
        sourcesRef.current.clear();
        setIsConnected(false);
        setIsConnecting(false);
    }, []);

    const startSession = async () => {
        if (userProfile.plan === 'Free') {
            onUpgradeRequest();
            return;
        }

        setIsConnecting(true);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (!inputAudioContextRef.current) {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: modality === 'video' });
          if (videoRef.current && modality === 'video') {
              videoRef.current.srcObject = stream;
          }

          const sessionPromise = ai.live.connect({
              model: 'gemini-2.5-flash-native-audio-preview-12-2025',
              callbacks: {
                  onopen: () => {
                      setIsConnecting(false);
                      setIsConnected(true);
                      
                      // Audio streaming
                      const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                      const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                      scriptProcessor.onaudioprocess = (e) => {
                          const inputData = e.inputBuffer.getChannelData(0);
                          const l = inputData.length;
                          const int16 = new Int16Array(l);
                          for (let i = 0; i < l; i++) {
                              int16[i] = inputData[i] * 32768;
                          }
                          const pcmBlob: Blob = {
                              data: encodeBase64(new Uint8Array(int16.buffer)),
                              mimeType: 'audio/pcm;rate=16000',
                          };
                          sessionPromise.then((session) => {
                              session.sendRealtimeInput({ media: pcmBlob });
                          });
                      };
                      source.connect(scriptProcessor);
                      scriptProcessor.connect(inputAudioContextRef.current!.destination);

                      // Video streaming if enabled
                      if (modality === 'video' && canvasRef.current && videoRef.current) {
                          const ctx = canvasRef.current.getContext('2d');
                          frameIntervalRef.current = window.setInterval(() => {
                              if (!videoRef.current || !ctx) return;
                              canvasRef.current!.width = videoRef.current.videoWidth || 640;
                              canvasRef.current!.height = videoRef.current.videoHeight || 480;
                              ctx.drawImage(videoRef.current, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
                              canvasRef.current!.toBlob(async (blob) => {
                                  if (blob) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                          const base64Data = (reader.result as string).split(',')[1];
                                          sessionPromise.then(s => s.sendRealtimeInput({
                                              media: { data: base64Data, mimeType: 'image/jpeg' }
                                          }));
                                      };
                                      reader.readAsDataURL(blob);
                                  }
                              }, 'image/jpeg', 0.6);
                          }, 1000);
                      }
                  },
                  onmessage: async (message: LiveServerMessage) => {
                      if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                          setIsModelSpeaking(true);
                          const audioData = decodeBase64(message.serverContent.modelTurn.parts[0].inlineData.data);
                          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current!.currentTime);
                          const buffer = await decodeAudioData(audioData, audioContextRef.current!, 24000, 1);
                          const source = audioContextRef.current!.createBufferSource();
                          source.buffer = buffer;
                          source.connect(audioContextRef.current!.destination);
                          source.addEventListener('ended', () => {
                              sourcesRef.current.delete(source);
                              if (sourcesRef.current.size === 0) setIsModelSpeaking(false);
                          });
                          source.start(nextStartTimeRef.current);
                          nextStartTimeRef.current += buffer.duration;
                          sourcesRef.current.add(source);
                      }
                      if (message.serverContent?.interrupted) {
                          for (const s of sourcesRef.current) {
                              try { s.stop(); } catch(e) {}
                          }
                          sourcesRef.current.clear();
                          nextStartTimeRef.current = 0;
                          setIsModelSpeaking(false);
                      }
                  },
                  onclose: () => stopSession(),
                  onerror: () => stopSession(),
              },
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                  },
                  systemInstruction: `You are a warm and knowledgeable cancer nutrition specialist at NutriCan.
                  User: ${userProfile.name}, Age: ${userProfile.age}, Condition: ${userProfile.cancerType}.
                  Assist with real-time food advice, symptom management, and emotional support.
                  Be encouraging and concise.`
              }
          });

          sessionRef.current = await sessionPromise;
        } catch (err) {
            console.error("Failed to start session:", err);
            setIsConnecting(false);
            alert("Please check your microphone and camera permissions.");
        }
    };

    useEffect(() => {
        return () => stopSession();
    }, [stopSession]);

    return (
        <div className="p-4 pb-40 animate-fade-in-up flex flex-col min-h-screen">
            <h1 className="text-3xl font-black mb-2 text-emerald-950 dark:text-white tracking-tighter">NutriCan Live</h1>
            <p className="text-gray-500 mb-10 font-medium">Real-time recovery consultation.</p>

            <div className="glass-panel p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-b-8 border-brand-green flex flex-col items-center">
                {isConnected ? (
                  <div className="w-full animate-fade-in">
                    <div className={`w-full aspect-video rounded-[2.5rem] mb-8 relative overflow-hidden bg-emerald-950 shadow-inner flex items-center justify-center ${modality === 'video' ? 'block' : 'hidden'}`}>
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                             <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                             <p className="text-white font-black text-xs uppercase tracking-widest">Live Video Consult</p>
                        </div>
                    </div>

                    {modality === 'audio' && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="flex items-center gap-1 h-12 mb-8">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className={`w-1.5 bg-brand-green rounded-full ${isModelSpeaking ? 'animate-bounce' : 'opacity-40'}`} style={{ height: isModelSpeaking ? `${20 + Math.random() * 80}%` : '10%', animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <p className="text-emerald-900 dark:text-emerald-300 font-black text-xl mb-1 uppercase tracking-tighter">NutriCan AI Expert</p>
                            <p className="text-gray-500 text-xs font-bold mb-10 uppercase tracking-widest">{isModelSpeaking ? 'Speaking...' : 'Listening...'}</p>
                        </div>
                    )}

                    <div className="flex justify-center gap-6">
                        <button onClick={() => { stopSession(); setModality(modality === 'audio' ? 'video' : 'audio'); }} className="p-5 glass-panel rounded-full shadow-lg active:scale-90 transition-all border-2 border-emerald-500/20">
                            {modality === 'audio' ? <VideoCallIcon className="w-6 h-6 text-brand-green" /> : <MicIcon className="w-6 h-6 text-brand-green" />}
                        </button>
                        <button onClick={stopSession} className="p-5 bg-red-500 text-white rounded-full shadow-lg active:scale-90 transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center w-full">
                    <div className="relative mb-10">
                        <div className="absolute inset-0 bg-brand-green/30 blur-3xl animate-pulse-soft"></div>
                        <div className="w-32 h-32 glass-panel rounded-[3rem] flex items-center justify-center relative border-2 border-brand-green/30 shadow-inner">
                            <BroadcastIcon className="w-16 h-16 text-brand-green" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-emerald-950 dark:text-white mb-3">Connect to Expert</h3>
                    <p className="text-gray-500 font-bold text-sm mb-12 max-w-[200px] mx-auto leading-relaxed">Instantly speak with a specialized cancer nutritionist via {modality}.</p>
                    <div className="card-button-wrapper w-full max-w-[240px]">
                        <button onClick={startSession} disabled={isConnecting} className="btn-primary w-full shadow-glow-large uppercase tracking-widest text-xs py-5">
                            {isConnecting ? 'Establishing Link...' : (userProfile.plan === 'Free' ? 'Upgrade to Connect' : 'Join Live Room')}
                        </button>
                    </div>
                  </div>
                )}
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => setModality('audio')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modality === 'audio' ? 'bg-brand-green text-white shadow-glow-primary' : 'glass-panel text-gray-400'}`}>Audio Mode</button>
                <button onClick={() => setModality('video')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modality === 'video' ? 'bg-brand-green text-white shadow-glow-primary' : 'glass-panel text-gray-400'}`}>Video Mode</button>
            </div>
        </div>
    );
};

// --- Standard Screens ---

const HomeScreen: React.FC<{ userProfile: UserProfile, setActivePage: (page: DashboardPage) => void, setModal: (content: React.ReactNode, options?: { fullScreen?: boolean }) => void }> = ({ userProfile, setActivePage, setModal }) => {
    const features = [
        { name: 'Personalised Meal Plan', icon: BowlIcon, color: 'bg-emerald-500', action: () => setModal(<MealPlanScreen userProfile={userProfile} />) },
        { name: 'Food Safety Checker', icon: SearchIcon, color: 'bg-teal-500', action: () => setModal(<FoodSafetyCheckerScreen userProfile={userProfile} />) },
        { name: 'Nutrient Tracker', icon: ChartIcon, color: 'bg-sky-500', action: () => setActivePage('tracker') },
        { name: 'Symptom Tips', icon: NauseaIcon, color: 'bg-indigo-500', action: () => setModal(<SymptomTipsScreen />) },
        { name: 'Library', icon: BookIcon, color: 'bg-violet-500', action: () => setActivePage('library') },
        { name: 'Alerts', icon: BellIcon, color: 'bg-rose-500', action: () => setModal(<RemindersScreen />) },
    ];
    return (
        <div className="p-6 page-transition pb-32">
            <div className="flex justify-between items-center mb-10">
                <div>
                  <h1 className="text-3xl font-black text-emerald-900 dark:text-white tracking-tight">Hi, {userProfile.name}</h1>
                  <p className="text-emerald-700/70 dark:text-emerald-400 font-bold">Your healing dashboard</p>
                </div>
                <button onClick={() => setActivePage('profile')} className="relative group">
                  <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-xl transition-all group-hover:bg-brand-green/40"></div>
                  <div className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center relative border border-white/40 shadow-glass group-active:scale-95 transition-transform">
                    <UserIcon className="w-7 h-7 text-brand-green" />
                  </div>
                </button>
            </div>

            <div className="relative rounded-[2.5rem] mb-12 h-60 overflow-hidden shadow-2xl group border-4 border-white/20 animate-fade-in-up">
                <img src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FVegetable%20loop%2Fvegetable1.png?alt=media&token=ad8be5e6-c143-4ea9-9029-1421423b37d9" className="w-full h-full object-cover animate-pulse-soft" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 bg-brand-green rounded-full animate-pulse shadow-glow-primary"></span>
                      <span className="text-[10px] font-black uppercase text-brand-green tracking-widest">Healing Power</span>
                    </div>
                    <p className="text-white font-black text-2xl drop-shadow-2xl leading-tight italic">"Strength begins with what's on your plate."</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {features.map((feature) => (
                    <div key={feature.name} className="card-button-wrapper">
                      <button onClick={feature.action} className="w-full p-6 flex flex-col items-center justify-center text-center gap-4 transition-all active:scale-95 group">
                          <div className={`p-4 ${feature.color} rounded-2xl shadow-xl transform group-hover:-translate-y-1 transition-transform`}>
                              <feature.icon className="w-8 h-8 text-white" />
                          </div>
                          <span className="font-extrabold text-xs text-emerald-950 dark:text-white uppercase tracking-tighter">{feature.name}</span>
                      </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfileScreen: React.FC<{ userProfile: UserProfile, onLogout: () => void, setModal: (content: React.ReactNode) => void, onProfileUpdate: (profile: UserProfile) => void }> = ({ userProfile, onLogout, setModal, onProfileUpdate }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    const openEditProfile = () => {
        setModal(
            <EditProfileForm 
                user={userProfile} 
                onSave={(updatedProfile) => {
                    onProfileUpdate(updatedProfile);
                    setModal(null);
                }}
                onCancel={() => setModal(null)}
            />
        );
    };

    return (
        <div className="p-8 pb-40">
            <div className="flex flex-col items-center mb-14 animate-fade-in-up">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-brand-green/40 blur-[80px] rounded-full animate-pulse-soft"></div>
                  <div className="w-40 h-40 glass-panel p-2 rounded-full border-4 border-brand-green/30 relative overflow-hidden shadow-2xl">
                      <div className="w-full h-full bg-gradient-to-br from-brand-green to-emerald-800 rounded-full flex items-center justify-center">
                        <UserIcon className="w-20 h-20 text-white" />
                      </div>
                  </div>
                </div>
                <h2 className="text-4xl font-black dark:text-white text-emerald-950 mb-3 tracking-tighter">{userProfile.name}</h2>
                <div className="px-8 py-2.5 bg-brand-green/10 border border-brand-green/20 rounded-full shadow-inner animate-pulse">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-green">{userProfile.plan} Member</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-5 mb-14">
              {[ { label: 'HGT', val: userProfile.height + 'cm' }, { label: 'WGT', val: userProfile.weight + 'kg' }, { label: 'AGE', val: userProfile.age } ].map(stat => (
                <div key={stat.label} className="glass-panel p-5 rounded-[2rem] text-center border-b-4 border-emerald-500/20 shadow-xl">
                  <p className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest mb-2">{stat.label}</p>
                  <p className="font-black text-xl text-emerald-950 dark:text-brand-emerald">{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
                <div className="card-button-wrapper">
                  <button onClick={openEditProfile} className="w-full p-6 flex justify-between items-center font-black text-emerald-900 dark:text-white group">
                    <span>Account Settings</span>
                    <ChevronLeftIcon className="w-6 h-6 rotate-180 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
                <div className="card-button-wrapper">
                  <button onClick={toggleTheme} className="w-full p-6 flex justify-between items-center font-black text-emerald-900 dark:text-white">
                    <span>Dark Appearance</span>
                    <div className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${theme === 'dark' ? 'bg-brand-green' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${theme === 'dark' ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </button>
                </div>
                <div className="pt-6">
                  <div className="card-button-wrapper !bg-transparent border-none p-0">
                    <button onClick={onLogout} className="btn-secondary w-full !bg-slate-900 !text-white !border-none !py-6 shadow-2xl active:scale-95 uppercase tracking-[0.3em] text-[11px] font-black">Sign Out Profile</button>
                  </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onLogout }) => {
  const [activePage, setActivePage] = useState<DashboardPage>('home');
  const [modalState, setModalState] = useState<{ content: React.ReactNode | null; fullScreen: boolean }>({ content: null, fullScreen: false });
  const [showPayment, setShowPayment] = useState(false);
  const [localProfile, setLocalProfile] = useState(userProfile);

  const setModal = useCallback((content: React.ReactNode, options?: { fullScreen?: boolean }) => {
    setModalState({ content, fullScreen: options?.fullScreen || false });
  }, []);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setLocalProfile(updatedProfile);
    // Force meal plan regeneration by updating the state that is passed to MealPlanScreen
  };

  const screens = useMemo(() => ({
    home: <HomeScreen userProfile={localProfile} setActivePage={setActivePage} setModal={setModal} />,
    tracker: <TrackerScreen userProfile={localProfile} setModal={setModal} />, 
    live: <LiveScreen userProfile={localProfile} onUpgradeRequest={() => setShowPayment(true)} />,
    library: <LibraryScreen />,
    profile: <ProfileScreen userProfile={localProfile} onLogout={onLogout} setModal={setModal} onProfileUpdate={handleProfileUpdate} />,
    'doctor-connect': <LiveScreen userProfile={localProfile} onUpgradeRequest={() => setShowPayment(true)} />,
  }), [localProfile, onLogout, setActivePage, setModal]);

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="animate-fade-in-up">{screens[activePage] || screens.home}</div>
      <EmergencyButton activePage={activePage} />
      <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
      {modalState.content && (
        <Modal closeModal={() => setModal(null)} fullScreen={modalState.fullScreen}>
            {modalState.content}
        </Modal>
      )}
      {showPayment && (
        <PaymentModal 
          onPaymentSuccess={() => { setLocalProfile(p => ({...p, plan: 'Premium'})); setShowPayment(false); }} 
          closeModal={() => setShowPayment(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;