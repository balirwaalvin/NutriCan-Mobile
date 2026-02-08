
import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { UserProfile, DashboardPage, WeeklyMealPlan, FoodSafetyStatus, FoodSafetyResult, Meal, NutrientInfo, SymptomType, RecommendedFood, JournalEntry, LoggedMeal, DoctorProfile, ChatMessage } from '../types';
import { HomeIcon, ChartIcon, BookIcon, PremiumIcon, UserIcon, SearchIcon, LogoIcon, ProteinIcon, CarbsIcon, BalancedIcon, BowlIcon, PlusIcon, NauseaIcon, MouthSoreIcon, BellIcon, ChatBubbleIcon, VideoCallIcon, ShareIcon, MicIcon, BroadcastIcon, ChevronLeftIcon } from './Icons';
import { checkFoodSafety, generateMealPlan, swapMeal, getNutrientInfo, getSymptomTips, getDoctorChatResponse } from '../services/geminiService';
import { db, auth } from '../services/db';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ThemeContext } from '../contexts/ThemeContext';

// --- Shared Props Interface ---
interface DashboardProps {
  userProfile: UserProfile;
  onLogout: () => void;
}

// --- Reusable UI Components ---

const BottomNavBar: React.FC<{ activePage: DashboardPage; onNavigate: (page: DashboardPage) => void }> = ({ activePage, onNavigate }) => {
  const navItems = [
    { page: 'home' as DashboardPage, icon: HomeIcon, label: 'Home' },
    { page: 'tracker' as DashboardPage, icon: ChartIcon, label: 'Tracker' },
    { page: 'live' as DashboardPage, icon: BroadcastIcon, label: 'Live' },
    { page: 'library' as DashboardPage, icon: BookIcon, label: 'Library' },
    { page: 'profile' as DashboardPage, icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full sm:max-w-md md:max-w-lg mx-auto bg-white/70 backdrop-blur-2xl border-t border-white/20 flex justify-around p-3 pb-6 dark:bg-emerald-950/40 z-30 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-[2.5rem]">
      {navItems.map(item => {
          const isActive = activePage === item.page;
          return (
            <button key={item.page} onClick={() => onNavigate(item.page)} className="flex flex-col items-center justify-center w-14 transition-all transform active:scale-90">
              <div className={`relative p-2.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-brand-green shadow-glow-primary scale-110' : 'bg-transparent'}`}>
                <item.icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 dark:text-emerald-700'}`} />
                {isActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>}
              </div>
              <span className={`text-[9px] mt-1.5 font-extrabold transition-all duration-300 uppercase tracking-tighter ${isActive ? 'text-brand-green dark:text-brand-emerald' : 'text-gray-400 opacity-60'}`}>{item.label}</span>
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
      <div className="fixed bottom-28 right-6 z-50">
        <button onClick={() => setShowModal(true)} className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-110 active:scale-95 transition-all group overflow-hidden">
            <span className="font-extrabold text-sm relative z-10">SOS</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="glass-panel p-8 rounded-[2rem] shadow-2xl text-center max-w-xs w-full animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <h2 className="text-2xl font-black mb-2 text-red-600 dark:text-red-400">Emergency</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Immediate medical assistance required?</p>
            <div className="space-y-3">
              <button className="btn-primary w-full !bg-red-600">Call Hospital</button>
              <button className="btn-secondary w-full">Call Caregiver</button>
            </div>
            <button onClick={() => setShowModal(false)} className="mt-6 text-gray-400 font-bold hover:text-gray-600 dark:hover:text-white transition-colors">Dismiss</button>
          </div>
        </div>
      )}
    </>
  );
};

// --- Modals ---

const PaymentModal: React.FC<{ onPaymentSuccess: () => void; closeModal: () => void }> = ({ onPaymentSuccess, closeModal }) => {
    const [processing, setProcessing] = useState(false);
    const handleUpgrade = () => {
        setProcessing(true);
        setTimeout(() => {
            onPaymentSuccess();
            setProcessing(false);
        }, 2000);
    };
    return (
        <div className="fixed inset-0 bg-emerald-950/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white dark:bg-emerald-950 max-w-sm w-full rounded-[3rem] p-10 text-center shadow-2xl relative border-b-8 border-brand-green overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-brand-green/10 to-transparent"></div>
                <button onClick={closeModal} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-emerald-900 dark:hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-float shadow-glow-primary">
                    <PremiumIcon className="w-12 h-12 text-brand-green" />
                </div>
                <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-4 tracking-tighter">NutriCan Pro</h2>
                <p className="text-gray-500 dark:text-emerald-200/60 mb-10 font-bold leading-relaxed px-2">Access real-time consultations and advanced biometrics.</p>
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-8 rounded-[2.5rem] mb-10 border border-emerald-500/10">
                    <p className="text-5xl font-black text-brand-green mb-1 tracking-tighter">$14.99<span className="text-sm text-emerald-900/40 dark:text-emerald-100/40 font-bold">/mo</span></p>
                    <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-widest">Priority Support Included</p>
                </div>
                <button onClick={handleUpgrade} disabled={processing} className="btn-primary w-full py-6 rounded-[2rem] text-xl font-black shadow-glow-primary mb-6 transform active:scale-95 transition-all disabled:opacity-50">
                    {processing ? 'Upgrading...' : 'Get Pro Access'}
                </button>
            </div>
        </div>
    );
};

const Modal: React.FC<{ children: React.ReactNode; closeModal: () => void }> = ({ children, closeModal }) => (
    <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-xl z-[100] flex items-end sm:items-center justify-center animate-fade-in" onClick={closeModal}>
        <div className="bg-white max-w-lg w-full h-[92%] sm:h-auto sm:max-h-[90vh] rounded-t-[3rem] sm:rounded-[3rem] overflow-y-auto dark:bg-emerald-950 animate-fade-in-up relative shadow-2xl border-t-8 border-brand-green" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-emerald-900 rounded-full sm:hidden"></div>
            <button onClick={closeModal} className="absolute top-6 right-6 p-3 glass-panel rounded-full hover:scale-110 transition-transform z-20">
                <svg className="w-6 h-6 text-emerald-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="p-2">{children}</div>
        </div>
    </div>
);

// --- Sub-Screens ---

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
        <div className="p-8 pb-16 min-h-[60vh]">
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2">Symptom Tips</h2>
            <p className="text-gray-500 mb-8 font-medium">Targeted nutrition for comfort.</p>
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
                    <button onClick={() => setSelectedSymptom(null)} className="flex items-center gap-2 text-brand-green font-black mb-6">
                        <ChevronLeftIcon className="w-5 h-5" /> Back
                    </button>
                    {loading ? (
                        <div className="text-center py-20"><LogoIcon className="animate-spin w-12 h-12 mx-auto text-brand-green" /></div>
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
    const reminders = [
        { title: 'Hydration', time: 'Every 2 hours', icon: BowlIcon, color: 'text-sky-500' },
        { title: 'Vitamin Check', time: '9:00 AM', icon: BellIcon, color: 'text-rose-500' },
        { title: 'Evening Walk', time: '5:30 PM', icon: HomeIcon, color: 'text-emerald-500' },
    ];
    return (
        <div className="p-8 pb-16">
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tight">Daily Alerts</h2>
            <p className="text-gray-500 mb-10 font-medium">Staying consistent with care.</p>
            <div className="space-y-5">
                {reminders.map((rem, i) => (
                    <div key={i} className="glass-panel p-6 rounded-[2.5rem] flex items-center gap-6 shadow-xl border-l-4 border-brand-green">
                        <div className={`p-4 bg-white dark:bg-emerald-900/30 rounded-2xl shadow-inner ${rem.color}`}>
                            <rem.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="font-black text-lg text-emerald-950 dark:text-white">{rem.title}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{rem.time}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="card-button-wrapper mt-10">
              <button className="btn-primary w-full">Add Reminder</button>
            </div>
        </div>
    );
};

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
        <div className="p-6 page-transition pb-24">
            <div className="flex justify-between items-center mb-10">
                <div>
                  <h1 className="text-3xl font-black text-emerald-900 dark:text-white tracking-tight">Hi, {userProfile.name}</h1>
                  <p className="text-emerald-700/70 dark:text-emerald-400 font-bold">Your healing journey</p>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="w-14 h-14 glass-panel rounded-2xl flex items-center justify-center relative border border-white/40 shadow-glass">
                    <UserIcon className="w-7 h-7 text-brand-green" />
                  </div>
                </div>
            </div>

            <div className="relative rounded-[2.5rem] mb-12 h-56 overflow-hidden shadow-2xl group border-4 border-white/20">
                <img src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FVegetable%20loop%2Fvegetable1.png?alt=media&token=ad8be5e6-c143-4ea9-9029-1421423b37d9" className="w-full h-full object-cover animate-pulse-soft" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent"></div>
                <div className="absolute bottom-6 left-8 right-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 bg-brand-green rounded-full animate-pulse shadow-glow-primary"></span>
                      <span className="text-[10px] font-black uppercase text-brand-green tracking-widest">Daily Motivation</span>
                    </div>
                    <p className="text-white font-black text-2xl drop-shadow-xl leading-tight italic">"Every healthy meal is a step toward strength."</p>
                </div>
            </div>

            <h2 className="text-[11px] font-black mb-6 text-emerald-900/60 dark:text-white/30 uppercase tracking-[0.2em] text-center">Your Essential Toolbox</h2>
            <div className="grid grid-cols-2 gap-6">
                {features.map((feature) => (
                    <div key={feature.name} className="card-button-wrapper">
                      <button onClick={feature.action} className="w-full p-6 flex flex-col items-center justify-center text-center gap-4 transition-all active:scale-95 group">
                          <div className={`p-4 ${feature.color} rounded-2xl shadow-xl transform group-hover:-translate-y-1 transition-transform`}>
                              <feature.icon className="w-7 h-7 text-white" />
                          </div>
                          <span className="font-extrabold text-sm text-emerald-950 dark:text-white tracking-tight">{feature.name}</span>
                      </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MealPlanScreen: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState((new Date().getDay() + 6) % 7);
  const [swappingState, setSwappingState] = useState<{dayIndex: number, mealType: string} | null>(null);
  const fetchMealPlan = useCallback(async () => {
    setLoading(true);
    const plan = await generateMealPlan(userProfile);
    setMealPlan(plan);
    setLoading(false);
  }, [userProfile]);
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
  if (loading) return <div className="p-20 text-center flex flex-col items-center justify-center h-full"><LogoIcon className="animate-spin h-16 w-16 text-brand-green mb-4" /><p className="font-black text-emerald-900 dark:text-emerald-300">Curating your meals...</p></div>;
  if (!mealPlan) return <div className="p-10 text-center">Failed to load plan.</div>;
  const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="p-6 pb-20">
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
                  <button onClick={onSwap} disabled={isSwapping} className="btn-primary w-full !text-base">Swap Option</button>
                </div>
            </div>
        </div>
    );
};

const FoodSafetyCheckerScreen: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    const [food, setFood] = useState('');
    const [result, setResult] = useState<FoodSafetyResult | null>(null);
    const [loading, setLoading] = useState(false);
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!food.trim()) return;
        setLoading(true);
        const safetyResult = await checkFoodSafety(food, userProfile);
        setResult(safetyResult);
        setLoading(false);
    };
    return (
        <div className="p-8 pb-20 page-transition">
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2">Food Guard</h2>
            <p className="text-gray-500 mb-10 font-medium">Verify safety instantly.</p>
            <form onSubmit={handleSearch} className="relative mb-12">
                <input type="text" value={food} onChange={(e) => setFood(e.target.value)} placeholder="Search food or ingredient..." className="w-full pl-8 pr-20 py-6 glass-panel rounded-[2.5rem] text-lg font-black outline-none focus:ring-4 focus:ring-brand-green/20 transition-all shadow-inner border-2 border-white/50" />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-green p-4 rounded-full text-white shadow-glow-primary active:scale-90 transition-all">
                    <SearchIcon className="w-6 h-6"/>
                </button>
            </form>
            {loading && <div className="text-center py-20"><LogoIcon className="animate-spin h-16 w-16 mx-auto text-brand-green" /></div>}
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

const TrackerScreen: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);
    const [journalData, setJournalData] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const fetchData = useCallback(async () => {
        setLoading(true);
        const [meals, journals] = await Promise.all([db.getMealLogs(), db.getJournalEntries()]);
        setLoggedMeals(meals);
        setJournalData(journals);
        setLoading(false);
    }, []);
    useEffect(() => { fetchData(); }, [fetchData]);
    return (
        <div className="p-6 pb-32">
            <h2 className="text-3xl font-black mb-8 text-emerald-950 dark:text-white tracking-tight">Wellness Tracker</h2>
            <div className="glass-panel p-8 rounded-[3rem] shadow-xl border-b-8 border-brand-green mb-10">
                <h3 className="text-[10px] font-black text-emerald-900/40 dark:text-white/30 uppercase tracking-[0.3em] mb-8 text-center">Energy & Health Trends</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={journalData.slice().reverse()}>
                            <defs>
                                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.6}/>
                                    <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="energy" stroke="#10B981" strokeWidth={5} fill="url(#trendGradient)" dot={{ r: 6, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} />
                            <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', backgroundColor: 'rgba(255,255,255,0.9)' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="flex gap-5 mb-12">
                <div className="card-button-wrapper flex-1">
                  <button className="w-full py-6 rounded-3xl flex flex-col items-center gap-2 bg-brand-green text-white shadow-glow-primary active:scale-95 transition-all">
                      <PlusIcon className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Log Meal</span>
                  </button>
                </div>
                <div className="card-button-wrapper flex-1">
                  <button className="w-full py-6 rounded-3xl flex flex-col items-center gap-2 bg-white dark:bg-emerald-900/30 text-emerald-600 font-black border-2 border-emerald-500/10 active:scale-95 transition-all">
                      <BookIcon className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Check-in</span>
                  </button>
                </div>
            </div>
            <h3 className="text-[10px] font-black mb-6 text-emerald-900/60 dark:text-white/30 uppercase tracking-[0.2em]">Recent Activity</h3>
            <div className="space-y-4">
                {loggedMeals.map(meal => (
                    <div key={meal.id} className="glass-panel p-6 rounded-[2.5rem] flex items-center gap-5 border-l-4 border-emerald-500 transition-all hover:translate-x-1">
                        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-brand-green shadow-inner">
                          <BowlIcon className="w-7 h-7" />
                        </div>
                        <div className="flex-grow">
                          <p className="font-black text-emerald-950 dark:text-white text-lg leading-tight capitalize">{meal.name}</p>
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1">{new Date(meal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <p className="text-brand-green font-black text-lg">{meal.nutrients.calories}<span className="text-[10px] ml-1">kcal</span></p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LibraryScreen: React.FC = () => {
    const resources = [
        { title: 'Dietary Fiber Essentials', category: 'Nutrition', readTime: '5 min', icon: BowlIcon },
        { title: 'Hydration & Treatment Recovery', category: 'Wellness', readTime: '3 min', icon: HomeIcon },
        { title: 'Ugandan Superfoods List', category: 'Local Diet', readTime: '8 min', icon: ProteinIcon },
    ];
    return (
        <div className="p-8 pb-32">
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tight">Learning Hub</h2>
            <p className="text-gray-500 mb-10 font-medium italic">Empower your recovery with knowledge.</p>
            <div className="space-y-5">
                {resources.map((res, i) => (
                    <div key={i} className="card-button-wrapper">
                      <button className="w-full p-6 flex justify-between items-center group text-left">
                          <div className="flex gap-5 items-center">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-brand-green group-hover:rotate-12 transition-transform">
                              <res.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <span className="text-[9px] font-black uppercase text-brand-green tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md mb-2 inline-block">#{res.category}</span>
                                <p className="font-black text-emerald-950 dark:text-white text-lg leading-tight">{res.title}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{res.readTime} reading time</p>
                            </div>
                          </div>
                          <ChevronLeftIcon className="w-6 h-6 rotate-180 text-gray-300 group-hover:text-brand-green transition-all group-hover:translate-x-1" />
                      </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LiveScreen: React.FC<{ userProfile: UserProfile; onUpgradeRequest: () => void }> = ({ userProfile, onUpgradeRequest }) => {
    return (
        <div className="p-10 page-transition flex flex-col items-center justify-center h-screen pb-40 text-center relative overflow-hidden">
             <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-green/30 blur-[120px] animate-pulse"></div>
             <div className="w-28 h-28 glass-panel rounded-[3rem] flex items-center justify-center mb-10 animate-float shadow-glow-primary border-2 border-emerald-500/50">
                <BroadcastIcon className="w-14 h-14 text-brand-green" />
             </div>
             <h1 className="text-4xl font-black text-emerald-950 dark:text-white mb-6 tracking-tighter">NutriCan Live</h1>
             <p className="text-gray-600 dark:text-emerald-100/70 mb-12 max-w-xs font-bold text-lg leading-relaxed">High-fidelity voice & video consultations with top specialists.</p>
             <div className="card-button-wrapper w-full max-w-xs">
                <button onClick={onUpgradeRequest} className="btn-primary w-full py-6 text-xl shadow-glow-large uppercase tracking-widest">Unlock Pro</button>
             </div>
             <div className="mt-14 flex flex-wrap justify-center gap-3">
                <div className="glass-panel px-5 py-3 rounded-2xl border border-emerald-500/20"><p className="text-[10px] font-black uppercase text-brand-green tracking-widest">Real-time Analysis</p></div>
                <div className="glass-panel px-5 py-3 rounded-2xl border border-emerald-500/20"><p className="text-[10px] font-black uppercase text-brand-green tracking-widest">End-to-End Secure</p></div>
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
                  <div className="absolute inset-0 bg-brand-green/40 blur-3xl rounded-full animate-pulse-soft"></div>
                  <div className="w-40 h-40 glass-panel p-1.5 rounded-full border-4 border-brand-green/30 relative overflow-hidden shadow-2xl">
                      <div className="w-full h-full bg-gradient-to-br from-brand-green to-emerald-800 rounded-full flex items-center justify-center">
                        <UserIcon className="w-20 h-20 text-white" />
                      </div>
                  </div>
                </div>
                <h2 className="text-4xl font-black dark:text-white text-emerald-950 mb-2 tracking-tighter">{userProfile.name}</h2>
                <div className="px-6 py-2 bg-brand-green/10 border border-brand-green/20 rounded-full shadow-inner">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-green">{userProfile.plan} Member</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-5 mb-14">
              {[ { label: 'Height', val: userProfile.height + 'cm' }, { label: 'Weight', val: userProfile.weight + 'kg' }, { label: 'Age', val: userProfile.age } ].map(stat => (
                <div key={stat.label} className="glass-panel p-5 rounded-[2rem] text-center border-b-4 border-emerald-500/20 shadow-xl">
                  <p className="text-[10px] font-black uppercase text-emerald-900/40 dark:text-white/30 tracking-widest mb-2">{stat.label}</p>
                  <p className="font-black text-xl text-emerald-950 dark:text-brand-emerald">{stat.val}</p>
                </div>
              ))}
            </div>
            <div className="space-y-5">
                <div className="card-button-wrapper">
                  <button className="w-full p-6 flex justify-between items-center font-black text-emerald-900 dark:text-white hover:bg-emerald-500/5 transition-all">
                    <span>Account Settings</span>
                    <ChevronLeftIcon className="w-6 h-6 rotate-180 opacity-40" />
                  </button>
                </div>
                <div className="card-button-wrapper">
                  <button onClick={toggleTheme} className="w-full p-6 flex justify-between items-center font-black text-emerald-900 dark:text-white hover:bg-emerald-500/5 transition-all">
                    <span>Dark Mode</span>
                    <div className={`w-14 h-7 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-brand-green' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-8' : 'left-1'}`}></div>
                    </div>
                  </button>
                </div>
                <div className="pt-6">
                  <button onClick={onLogout} className="btn-secondary w-full !bg-slate-900 !text-white !border-none !py-6 shadow-2xl active:scale-95">Sign Out</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onLogout }) => {
  const [activePage, setActivePage] = useState<DashboardPage>('home');
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [localProfile, setLocalProfile] = useState(userProfile);

  const screens = useMemo(() => ({
    home: <HomeScreen userProfile={localProfile} setActivePage={setActivePage} setModal={setModalContent} />,
    tracker: <TrackerScreen userProfile={localProfile} />,
    live: <LiveScreen userProfile={localProfile} onUpgradeRequest={() => setShowPayment(true)} />,
    library: <LibraryScreen />,
    profile: <ProfileScreen userProfile={localProfile} onLogout={onLogout} />,
    'doctor-connect': <LiveScreen userProfile={localProfile} onUpgradeRequest={() => setShowPayment(true)} />,
  }), [localProfile, onLogout]);

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="animate-fade-in-up">{screens[activePage] || screens.home}</div>
      <EmergencyButton activePage={activePage} />
      <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
      {modalContent && <Modal closeModal={() => setModalContent(null)}>{modalContent}</Modal>}
      {showPayment && <PaymentModal onPaymentSuccess={() => { setLocalProfile(p => ({...p, plan: 'Premium'})); setShowPayment(false); }} closeModal={() => setShowPayment(false)} />}
    </div>
  );
};

export default Dashboard;
