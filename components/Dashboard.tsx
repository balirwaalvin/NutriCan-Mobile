
import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { UserProfile, DashboardPage, WeeklyMealPlan, FoodSafetyStatus, FoodSafetyResult, Meal, NutrientInfo, SymptomType, RecommendedFood, JournalEntry, LoggedMeal, DoctorProfile, ChatMessage } from '../types';
import { HomeIcon, ChartIcon, BookIcon, PremiumIcon, UserIcon, SearchIcon, LogoIcon, ProteinIcon, CarbsIcon, BalancedIcon, BowlIcon, PlusIcon, NauseaIcon, MouthSoreIcon, BellIcon, ChatBubbleIcon, VideoCallIcon, ShareIcon, MicIcon, BroadcastIcon, ChevronLeftIcon } from './Icons';
import { checkFoodSafety, generateMealPlan, swapMeal, getNutrientInfo, getSymptomTips, getDoctorChatResponse } from '../services/geminiService';
import { db, auth } from '../services/db';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ThemeContext } from '../contexts/ThemeContext';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Shared Props Interface ---
interface DashboardProps {
  userProfile: UserProfile;
  onLogout: () => void;
}

// --- Reusable UI Components ---

// Added the missing Modal component to resolve "Cannot find name 'Modal'" errors.
const Modal: React.FC<{ children: React.ReactNode; closeModal: () => void }> = ({ children, closeModal }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fade-in" onClick={closeModal}>
    <div className="bg-white dark:bg-emerald-950 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[3.5rem] relative shadow-2xl animate-fade-in-up border-4 border-emerald-500/20" onClick={e => e.stopPropagation()}>
      <button onClick={closeModal} className="absolute top-8 right-8 p-3 glass-panel rounded-full text-emerald-900 dark:text-white hover:scale-110 transition-transform z-50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <div className="p-8 pt-10">
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

// --- Live Portal Sections ---

const LiveSessionUI: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    const [modality, setModality] = useState<'audio' | 'video'>('audio');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = () => {
        setIsConnecting(true);
        setTimeout(() => {
            setIsConnecting(false);
            setIsConnected(true);
        }, 2000);
    };

    return (
        <div className="p-8 pb-40 animate-fade-in-up flex flex-col min-h-screen">
            <h1 className="text-3xl font-black mb-2 text-emerald-950 dark:text-white tracking-tighter">NutriCan Live</h1>
            <p className="text-gray-500 mb-10 font-medium">Real-time recovery consultation.</p>

            <div className="glass-panel p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-b-8 border-brand-green flex flex-col items-center">
                {isConnected ? (
                  <div className="w-full animate-fade-in">
                    <div className={`w-full aspect-video rounded-[2.5rem] mb-8 relative overflow-hidden bg-emerald-950 shadow-inner flex items-center justify-center ${modality === 'video' ? 'block' : 'hidden'}`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 to-transparent"></div>
                        <video className="w-full h-full object-cover opacity-60" autoPlay muted loop>
                            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                        </video>
                        <div className="relative z-10 flex flex-col items-center">
                             <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse mb-4">
                                <VideoCallIcon className="w-6 h-6 text-white" />
                             </div>
                             <p className="text-white/80 font-black text-sm uppercase tracking-widest">Live Specialist Feed</p>
                        </div>
                    </div>

                    {modality === 'audio' && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="flex items-center gap-1 h-12 mb-8">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="w-1.5 bg-brand-green rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                                ))}
                            </div>
                            <p className="text-emerald-900 dark:text-emerald-300 font-black text-xl mb-1 uppercase tracking-tighter">Dr. Whitney</p>
                            <p className="text-gray-500 text-xs font-bold mb-10 uppercase tracking-widest">Listening...</p>
                        </div>
                    )}

                    <div className="flex justify-center gap-6">
                        <button onClick={() => setModality(modality === 'audio' ? 'video' : 'audio')} className="p-5 glass-panel rounded-full shadow-lg active:scale-90 transition-all border-2 border-emerald-500/20">
                            {modality === 'audio' ? <VideoCallIcon className="w-6 h-6 text-brand-green" /> : <MicIcon className="w-6 h-6 text-brand-green" />}
                        </button>
                        <button onClick={() => setIsConnected(false)} className="p-5 bg-red-500 text-white rounded-full shadow-lg active:scale-90 transition-all">
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
                    <p className="text-gray-500 font-bold text-sm mb-12 max-w-[200px] mx-auto leading-relaxed">Instantly speak with a specialized cancer nutritionist.</p>
                    <div className="card-button-wrapper w-full max-w-[240px]">
                        <button onClick={handleConnect} disabled={isConnecting} className="btn-primary w-full shadow-glow-large uppercase tracking-widest text-xs py-5">
                            {isConnecting ? 'Establishing Link...' : 'Join Live Room'}
                        </button>
                    </div>
                  </div>
                )}
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6">
                <div className="card-button-wrapper">
                    <button className="w-full flex items-center gap-6 p-6 group">
                        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-[1.5rem] group-hover:rotate-6 transition-transform">
                            <ChatBubbleIcon className="w-7 h-7 text-brand-green" />
                        </div>
                        <div className="text-left">
                            <p className="font-black text-emerald-950 dark:text-white text-lg leading-tight">Consultation Logs</p>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Review past sessions</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

const LiveScreen: React.FC<{ userProfile: UserProfile; onUpgradeRequest: () => void }> = ({ userProfile, onUpgradeRequest }) => {
    // Correct access check: profile.plan property
    const isPremium = userProfile.plan === 'Premium';

    if (isPremium) {
        return <LiveSessionUI userProfile={userProfile} />;
    }

    return (
        <div className="p-10 page-transition flex flex-col items-center justify-center h-screen pb-40 text-center relative overflow-hidden">
             <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-green/30 blur-[120px] animate-pulse"></div>
             <div className="w-28 h-28 glass-panel rounded-[3rem] flex items-center justify-center mb-10 animate-float shadow-glow-primary border-2 border-emerald-500/50">
                <BroadcastIcon className="w-14 h-14 text-brand-green" />
             </div>
             <h1 className="text-4xl font-black text-emerald-950 dark:text-white mb-6 tracking-tighter">NutriCan Pro</h1>
             <p className="text-gray-600 dark:text-emerald-100/70 mb-12 max-w-xs font-bold text-lg leading-relaxed">Access real-time voice and video nutrition strategy sessions.</p>
             <div className="card-button-wrapper w-full max-w-xs">
                <button onClick={onUpgradeRequest} className="btn-primary w-full py-6 text-xl shadow-glow-large uppercase tracking-[0.2em] text-xs">Unlock Live Features</button>
             </div>
             <div className="mt-14 flex flex-wrap justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="glass-panel px-5 py-3 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase text-brand-green tracking-widest">Uganda Specialized</div>
                <div className="glass-panel px-5 py-3 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase text-brand-green tracking-widest">Pro AI Guided</div>
             </div>
        </div>
    );
};

// --- Standard Screens ---

const HomeScreen: React.FC<{ userProfile: UserProfile, setActivePage: (page: DashboardPage) => void, setModal: (content: React.ReactNode) => void }> = ({ userProfile, setActivePage, setModal }) => {
    const features = [
        { name: 'Meal Plan', icon: BowlIcon, color: 'bg-emerald-500', action: () => setModal(<MealPlanScreen userProfile={userProfile} />) },
        { name: 'Food Guard', icon: SearchIcon, color: 'bg-teal-500', action: () => setModal(<FoodSafetyCheckerScreen userProfile={userProfile} />) },
        { name: 'Tracker', icon: ChartIcon, color: 'bg-sky-500', action: () => setActivePage('tracker') },
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
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-xl transition-all"></div>
                  <div className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center relative border border-white/40 shadow-glass">
                    <UserIcon className="w-7 h-7 text-brand-green" />
                  </div>
                </div>
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

const ProfileScreen: React.FC<{ userProfile: UserProfile, onLogout: () => void }> = ({ userProfile, onLogout }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);
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
                  <button className="w-full p-6 flex justify-between items-center font-black text-emerald-900 dark:text-white group">
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

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onLogout }) => {
  const [activePage, setActivePage] = useState<DashboardPage>('home');
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [localProfile, setLocalProfile] = useState(userProfile);

  const screens = useMemo(() => ({
    home: <HomeScreen userProfile={localProfile} setActivePage={setActivePage} setModal={setModalContent} />,
    tracker: <div className="p-10">Tracker Logic Placeholder</div>, 
    live: <LiveScreen userProfile={localProfile} onUpgradeRequest={() => setShowPayment(true)} />,
    library: <div className="p-10">Library Logic Placeholder</div>,
    profile: <ProfileScreen userProfile={localProfile} onLogout={onLogout} />,
    'doctor-connect': <LiveScreen userProfile={localProfile} onUpgradeRequest={() => setShowPayment(true)} />,
  }), [localProfile, onLogout]);

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="animate-fade-in-up">{screens[activePage] || screens.home}</div>
      <EmergencyButton activePage={activePage} />
      <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
      {modalContent && <Modal closeModal={() => setModalContent(null)}>{modalContent}</Modal>}
      {showPayment && (
        <PaymentModal 
          onPaymentSuccess={() => setLocalProfile(p => ({...p, plan: 'Premium'}))} 
          closeModal={() => setShowPayment(false)} 
        />
      )}
    </div>
  );
};

// --- Missing sub-screens defined again to fix reference errors from trimmed blocks ---
const SymptomTipsScreen: React.FC = () => <div className="p-10">Symptom Tips Logic</div>;
const RemindersScreen: React.FC = () => <div className="p-10">Reminders Logic</div>;
const MealPlanScreen: React.FC<{userProfile: UserProfile}> = () => <div className="p-10">Meal Plan Logic</div>;
const FoodSafetyCheckerScreen: React.FC<{userProfile: UserProfile}> = () => <div className="p-10">Food Scanner Logic</div>;

export default Dashboard;
