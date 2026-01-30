
import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { UserProfile, DashboardPage, WeeklyMealPlan, FoodSafetyStatus, FoodSafetyResult, Meal, NutrientInfo, SymptomType, RecommendedFood, JournalEntry, LoggedMeal, DoctorProfile, ChatMessage } from '../types';
import { HomeIcon, ChartIcon, BookIcon, PremiumIcon, UserIcon, SearchIcon, LogoIcon, ProteinIcon, CarbsIcon, BalancedIcon, BowlIcon, PlusIcon, NauseaIcon, MouthSoreIcon, BellIcon, ChatBubbleIcon, VideoCallIcon, ShareIcon, MicIcon, BroadcastIcon, ChevronLeftIcon } from './Icons';
import { checkFoodSafety, generateMealPlan, swapMeal, getNutrientInfo, getSymptomTips, getDoctorChatResponse } from '../services/geminiService';
import { db, auth } from '../services/db';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ThemeContext } from '../contexts/ThemeContext';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

// --- Reusable UI Components ---

const BottomNavBar: React.FC<{ activePage: DashboardPage; onNavigate: (page: DashboardPage) => void }> = ({ activePage, onNavigate }) => {
  const navItems = [
    { page: 'home' as DashboardPage, icon: HomeIcon, label: 'Home' },
    { page: 'tracker' as DashboardPage, icon: ChartIcon, label: 'Tracker' },
    { page: 'live' as DashboardPage, icon: BroadcastIcon, label: 'Live' },
    { page: 'doctor-connect' as DashboardPage, icon: PremiumIcon, label: 'Doctor' },
    { page: 'profile' as DashboardPage, icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full sm:max-w-md md:max-w-lg mx-auto bg-white/95 backdrop-blur-xl border-t border-emerald-100 flex justify-around p-2 dark:bg-slate-900/95 dark:border-slate-700 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      {navItems.map(item => {
          const isActive = activePage === item.page;
          return (
            <button key={item.page} onClick={() => onNavigate(item.page)} className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all transform active:scale-95">
              <div className={`relative p-2 rounded-full transition-all duration-300 ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}`}>
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-400 dark:text-slate-500'}`} />
              </div>
              <span className={`text-[10px] mt-1 transition-colors ${isActive ? 'text-emerald-700 font-bold dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>{item.label}</span>
            </button>
          )
      })}
    </div>
  );
};

const EmergencyButton: React.FC<{ activePage: DashboardPage }> = ({ activePage }) => {
  const [showModal, setShowModal] = useState(false);
  
  if (activePage === 'tracker') {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-24 left-0 right-0 w-full sm:max-w-md md:max-w-lg mx-auto pointer-events-none z-50 px-4">
        <button onClick={() => setShowModal(true)} className="pointer-events-auto float-right bg-gradient-to-b from-red-500 to-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center text-lg font-bold animate-pulse transition-all hover:scale-105 active:scale-95 active:translate-y-1 border border-white/20 relative overflow-hidden shadow-lg" style={{ boxShadow: '0 4px 0 #7f1d1d, 0 8px 10px rgba(0,0,0,0.3)' }}>
            <span className="relative z-10 drop-shadow-md">SOS</span>
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2 pointer-events-none rounded-full"></div>
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded-2xl shadow-2xl text-center dark:bg-slate-800 animate-fade-in-up max-w-xs w-full border border-red-100" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Emergency Contact</h2>
            <button className="w-full bg-gradient-to-b from-red-500 to-red-700 text-white py-4 px-6 rounded-xl mb-4 font-bold transition-all hover:-translate-y-0.5 active:scale-95 active:translate-y-0 relative overflow-hidden" style={{ boxShadow: '0 4px 0 #991b1b, 0 8px 15px rgba(0,0,0,0.2)' }}>
                <span className="relative z-10">Call Hospital</span>
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2 pointer-events-none"></div>
            </button>
            <button className="w-full bg-gradient-to-b from-blue-500 to-cyan-600 text-white py-4 px-6 rounded-xl font-bold transition-all hover:-translate-y-0.5 active:scale-95 active:translate-y-0 mb-6 relative overflow-hidden" style={{ boxShadow: '0 4px 0 #0e7490, 0 8px 15px rgba(0,0,0,0.2)' }}>
                <span className="relative z-10">Call Caregiver</span>
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2 pointer-events-none"></div>
            </button>
            <button onClick={() => setShowModal(false)} className="btn-tertiary">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};


// --- Feature Screens ---

const HomeScreen: React.FC<{ userProfile: UserProfile, setActivePage: (page: DashboardPage) => void, setModal: (content: React.ReactNode) => void }> = ({ userProfile, setActivePage, setModal }) => {
    const features = [
        { name: 'Personalized Meal Plan', icon: BowlIcon, action: () => setModal(<MealPlanScreen userProfile={userProfile} />) },
        { name: 'Food Safety Checker', icon: SearchIcon, action: () => setModal(<FoodSafetyCheckerScreen userProfile={userProfile} />) },
        { name: 'Nutrient Tracker', icon: ChartIcon, action: () => setActivePage('tracker') },
        { name: 'Symptom-Based Tips', icon: NauseaIcon, action: () => setModal(<SymptomTipsScreen />) },
        { name: 'Resource Library', icon: BookIcon, action: () => setActivePage('library') },
        { name: 'Reminders & Alerts', icon: BellIcon, action: () => setModal(<RemindersScreen />) },
    ];
    
    const imageUrls = [
        'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FVegetable%20loop%2Fvegetable1.png?alt=media&token=ad8be5e6-c143-4ea9-9029-1421423b37d9',
        'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FVegetable%20loop%2Fvegetable2.png?alt=media&token=18a1998d-e0ba-4a48-aa16-1764525ba9ab',
        'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FVegetable%20loop%2Fvegetable3.png?alt=media&token=8aa3463d-e850-4bc1-8d86-5ea8d457eb1b',
    ];

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentImageIndex(prevIndex => (prevIndex + 1) % imageUrls.length);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [imageUrls.length]);
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="bg-gradient-header-light p-4 rounded-2xl mb-6 dark:bg-gradient-header-dark shadow-lg border border-emerald-100 dark:border-slate-700">
                <h1 className="text-2xl font-bold text-emerald-900 dark:text-gray-100">Hello, {userProfile.name}!</h1>
                <p className="text-emerald-700 dark:text-gray-300">Here's today's plan.</p>
            </div>
            <div className="relative rounded-2xl mb-6 w-full h-44 overflow-hidden shadow-xl border-2 border-emerald-50 dark:border-slate-600">
                {imageUrls.map((url, index) => (
                    <img
                        key={url}
                        src={url}
                        alt="Fresh vegetables"
                        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out animate-ken-burns ${
                            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                ))}
                 <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/80 via-emerald-900/20 to-transparent"></div>
                 <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold text-xl drop-shadow-lg leading-tight">Stay strong, eat well.</p>
                 </div>
            </div>
            <div className="grid grid-cols-2 gap-4 animate-stagger-children">
                {features.map((feature, index) => (
                    <button key={feature.name} onClick={feature.action} className="btn-tertiary h-full min-h-[120px] !flex-col items-center justify-center text-center px-3 gap-2" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="p-3 bg-white/80 rounded-full shadow-sm backdrop-blur-sm">
                            <feature.icon className="w-8 h-8 text-emerald-800 opacity-90" />
                        </div>
                        <span className="font-bold text-sm text-white leading-tight">{feature.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const Modal: React.FC<{ children: React.ReactNode; closeModal: () => void }> = ({ children, closeModal }) => (
    <div className="fixed inset-0 bg-emerald-900/80 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in" onClick={closeModal}>
        <div className="bg-white max-w-sm w-full h-full overflow-y-auto dark:bg-slate-900 animate-fade-in-up relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 p-2 bg-emerald-100 rounded-full hover:bg-emerald-200 dark:bg-slate-800 dark:hover:bg-slate-700 z-10 transition-colors shadow-button active:scale-95">
                <svg className="w-6 h-6 text-emerald-800 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {children}
        </div>
    </div>
);


const MealCard: React.FC<{ meal: Meal, title: string, delay: number, onSwap: () => void, isSwapping: boolean }> = ({ meal, title, delay, onSwap, isSwapping }) => {
    const categoryIcon = {
        Protein: <ProteinIcon className="w-5 h-5" />,
        Carbs: <CarbsIcon className="w-5 h-5" />,
        Balanced: <BalancedIcon className="w-5 h-5" />,
        Veggies: <BowlIcon className="w-5 h-5" />,
    }[meal.category] || <BowlIcon className="w-5 h-5" />;

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden dark:bg-slate-800 animate-fade-in-up border-b-4 border-emerald-600" style={{ animationDelay: `${delay}ms` }}>
            <div className="relative">
                <img src={meal.photoUrl} alt={meal.name} className="w-full h-36 object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 to-transparent"></div>
                {isSwapping && <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center backdrop-blur-sm"><LogoIcon className="animate-spin h-10 w-10 text-emerald-400" /></div>}
                <p className="absolute bottom-3 left-4 font-bold text-xl text-white drop-shadow-md">{meal.name}</p>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
                    <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {categoryIcon}
                        <span>{meal.category}</span>
                    </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 dark:text-gray-400 leading-relaxed">{meal.description}</p>
                
                {meal.reason && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-900 dark:text-blue-100 shadow-sm">
                        <div className="flex items-center mb-1">
                            <svg className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span className="font-bold uppercase tracking-wide text-xs text-blue-700 dark:text-blue-300">Why this recommendation</span>
                        </div>
                        <p className="opacity-90">{meal.reason}</p>
                    </div>
                )}

                <button onClick={onSwap} disabled={isSwapping} className="btn-small-gradient w-full disabled:opacity-50">
                    Swap Meal
                </button>
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
  
  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  const handleSwapMeal = async (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!mealPlan) return;
    setSwappingState({ dayIndex, mealType });
    const mealToSwap = mealPlan[dayIndex][mealType];
    const newMeal = await swapMeal(userProfile, mealToSwap, mealPlan[dayIndex].day, mealType);
    if (newMeal && mealPlan) {
      const updatedPlan = [...mealPlan];
      updatedPlan[dayIndex] = { ...updatedPlan[dayIndex], [mealType]: newMeal };
      setMealPlan(updatedPlan);
    } else {
        alert("Sorry, we couldn't find a replacement meal. Please try again.");
    }
    setSwappingState(null);
  };

  if (loading) return <div className="p-8 text-center dark:text-gray-300 flex flex-col items-center justify-center h-full"><LogoIcon className="animate-spin h-12 w-12 mb-4 text-emerald-600" /><p>Curating your personalized menu based on your BMI and needs...</p></div>;
  if (!mealPlan) return <div className="p-8 text-center dark:text-gray-300">Could not generate a meal plan. Please check your connection and try again.</div>;

  const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const selectedDayData = mealPlan[selectedDayIndex];

  return (
    <div className="p-6 bg-transparent min-h-full">
      <h2 className="text-3xl font-bold mb-6 dark:text-white animate-fade-in text-emerald-900">Weekly Plan</h2>
      
      <div className="flex justify-between gap-1 mb-6 bg-emerald-50 dark:bg-slate-800 p-2 rounded-2xl border border-emerald-200 dark:border-slate-700 shadow-inner">
        {dayShortNames.map((day, index) => (
          <button 
            key={day}
            onClick={() => setSelectedDayIndex(index)}
            className={`px-1 py-2 rounded-xl font-bold text-xs flex-1 transition-all duration-300 relative overflow-hidden ${selectedDayIndex === index ? 'text-white shadow-button' : 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-slate-700'}`}
            style={selectedDayIndex === index ? { background: 'linear-gradient(to bottom, #0f766e, #0d9488)' } : {}}
          >
            <span className="relative z-10">{day}</span>
            {selectedDayIndex === index && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none"></div>}
          </button>
        ))}
      </div>

      <div key={selectedDayIndex} className="animate-fade-in pb-6">
        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-4 text-center bg-emerald-100 dark:bg-emerald-900/20 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">{selectedDayData.day}</h3>
        <div className="space-y-6">
            <MealCard 
              meal={selectedDayData.breakfast} 
              title="Breakfast" 
              delay={100} 
              onSwap={() => handleSwapMeal(selectedDayIndex, 'breakfast')} 
              isSwapping={swappingState?.dayIndex === selectedDayIndex && swappingState?.mealType === 'breakfast'}
            />
            <MealCard 
              meal={selectedDayData.lunch} 
              title="Lunch" 
              delay={200} 
              onSwap={() => handleSwapMeal(selectedDayIndex, 'lunch')} 
              isSwapping={swappingState?.dayIndex === selectedDayIndex && swappingState?.mealType === 'lunch'}
            />
            <MealCard 
              meal={selectedDayData.dinner} 
              title="Dinner" 
              delay={300} 
              onSwap={() => handleSwapMeal(selectedDayIndex, 'dinner')} 
              isSwapping={swappingState?.dayIndex === selectedDayIndex && swappingState?.mealType === 'dinner'}
            />
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
        if (!food) return;
        setLoading(true);
        setResult(null);
        const safetyResult = await checkFoodSafety(food, userProfile);
        setResult(safetyResult);
        setLoading(false);
    };

    const statusStyles = {
        [FoodSafetyStatus.SAFE]: {
            base: 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-700',
            shadow: 'shadow-glow-emerald',
        },
        [FoodSafetyStatus.LIMIT]: {
            base: 'bg-yellow-50 text-yellow-900 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-100 dark:border-yellow-700',
            shadow: 'shadow-glow-yellow',
        },
        [FoodSafetyStatus.AVOID]: {
            base: 'bg-red-50 text-red-900 border-red-300 dark:bg-red-900/40 dark:text-red-100 dark:border-red-700',
            shadow: 'shadow-glow-red',
        },
    };

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Food Safety</h2>
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <input 
                    type="text"
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    placeholder="e.g., Avocado"
                    className="flex-grow p-4 border-2 rounded-2xl bg-white border-emerald-100 dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner"
                />
                <button type="submit" className="bg-gradient-to-b from-teal-800 to-emerald-900 text-white p-3 rounded-2xl shadow-button hover:shadow-button-hover active:scale-95 transition-all flex items-center justify-center w-14 relative overflow-hidden">
                    <span className="relative z-10"><SearchIcon className="w-6 h-6"/></span>
                     <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none"></div>
                </button>
            </form>

            {loading && <div className="text-center p-8"><LogoIcon className="animate-spin h-10 w-10 mx-auto text-emerald-600" /><p className="mt-2 text-gray-500">Checking safety...</p></div>}
            {result && (
                <div className={`p-5 rounded-2xl border-l-8 shadow-lg ${statusStyles[result.status].base} ${statusStyles[result.status].shadow} animate-fade-in transform transition-all`}>
                    <div className="flex items-start">
                        <div className="mr-4 mt-1">
                             {result.status === FoodSafetyStatus.SAFE ? <BowlIcon className="w-8 h-8 text-emerald-600" /> : <div className="w-8 h-8 rounded-full bg-current opacity-20"></div>}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-xl capitalize">{food}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${statusStyles[result.status].base} bg-white/50 shadow-sm`}>{result.status}</span>
                            </div>
                            <p className="text-base font-medium opacity-90">{result.reason}</p>
                        </div>
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

    const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
    const [mealName, setMealName] = useState('');
    const [isAddingMeal, setIsAddingMeal] = useState(false);

    const [isAddJournalModalOpen, setIsAddJournalModalOpen] = useState(false);
    const [newJournalEntry, setNewJournalEntry] = useState({ weight: '', bp: '', energy: '', notes: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [meals, journals] = await Promise.all([
                db.getMealLogs(),
                db.getJournalEntries()
            ]);
            setLoggedMeals(meals);
            setJournalData(journals);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const todaysNutrients = useMemo<NutrientInfo>(() => {
        const today = new Date().toDateString();
        return loggedMeals
            .filter(meal => new Date(meal.timestamp).toDateString() === today)
            .reduce((acc, meal) => {
                if (meal.nutrients) {
                    acc.calories += meal.nutrients.calories || 0;
                    acc.sugar += meal.nutrients.sugar || 0;
                    acc.salt += meal.nutrients.salt || 0;
                }
                return acc;
            }, { calories: 0, sugar: 0, salt: 0 });
    }, [loggedMeals]);

    const nutrientData = [
        { name: 'Calories', value: todaysNutrients.calories, goal: 2000, unit: 'kcal', color: '#22C55E' },
        { name: 'Sugar', value: todaysNutrients.sugar, goal: 50, unit: 'g', color: '#14B8A6' },
        { name: 'Salt', value: todaysNutrients.salt, goal: 2.3, unit: 'g', color: '#A3E635' },
    ];

    const handleAddMeal = async () => {
        if (!mealName.trim()) return;
        setIsAddingMeal(true);
        const result = await getNutrientInfo(mealName);
        if (result) {
            try {
                await db.addMealLog({
                    name: mealName,
                    nutrients: result,
                });
                setMealName('');
                setIsAddMealModalOpen(false);
                fetchData();
            } catch (e) {
                alert("Failed to save meal. Please try again.");
            }
        } else {
            alert("Could not get nutrient information for this meal. Please try again.");
        }
        setIsAddingMeal(false);
    };

    const handleJournalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewJournalEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleAddJournalEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const weight = parseFloat(newJournalEntry.weight);
        const bp = newJournalEntry.bp ? parseInt(newJournalEntry.bp, 10) : undefined;
        const energy = parseInt(newJournalEntry.energy, 10);
        const notes = newJournalEntry.notes.trim();

        if (isNaN(weight) || isNaN(energy) || energy < 1 || energy > 10) {
            alert("Please enter valid numbers for Weight and Energy. Energy must be 1-10.");
            return;
        }

        try {
            await db.addJournalEntry({ weight, bp, energy, notes: notes || undefined });
            setNewJournalEntry({ weight: '', bp: '', energy: '', notes: '' });
            setIsAddJournalModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to add journal entry:", error);
            alert("Could not save your entry. Please try again.");
        }
    };

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const historyItems = useMemo(() => {
        const combined = [
            ...loggedMeals.map(m => ({ ...m, type: 'meal' as const })),
            ...journalData.map(j => ({ ...j, type: 'journal' as const }))
        ];
        return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
    }, [loggedMeals, journalData]);

    return (
        <div className="p-6 animate-fade-in pb-24 relative min-h-full">
            <h2 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Tracker</h2>

            <div className="mb-8">
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-4">Today's Nutrition</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                    {nutrientData.map(item => {
                        const percentage = Math.min((item.value / item.goal) * 100, 100);
                        const isOver = item.value > item.goal;
                        return (
                            <div key={item.name} className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-emerald-50 dark:border-slate-700">
                                <div className="h-20 w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={[{ value: percentage }, { value: 100 - percentage }]} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={35} startAngle={90} endAngle={-270} paddingAngle={0} cornerRadius={10} isAnimationActive={true}>
                                                <Cell fill={isOver ? '#EF4444' : item.color} />
                                                <Cell fill={isOver ? 'rgba(239, 68, 68, 0.2)' : 'rgba(226, 232, 240, 0.5)'} />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="font-bold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.name}</p>
                                <p className={`text-sm font-bold ${isOver ? 'text-red-500' : 'text-emerald-800 dark:text-emerald-300'}`}>
                                    {item.value.toFixed(1)} <span className="text-[10px] font-normal text-gray-400">/ {item.goal}{item.unit}</span>
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-4">Health Trends</h3>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-700 relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl z-10">
                            <LogoIcon className="animate-spin h-8 w-8 text-emerald-600"/>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={journalData.slice().reverse()}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#064E3B" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#064E3B" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 12}} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" orientation="left" stroke="#064E3B" hide />
                            <YAxis yAxisId="right" orientation="right" stroke="#10B981" hide />
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                            <Legend iconType="circle" wrapperStyle={{paddingTop: '10px'}}/>
                            <Area yAxisId="left" type="monotone" dataKey="weight" stroke="#064E3B" strokeWidth={3} fill="url(#colorWeight)" name="Weight" isAnimationActive={!loading}/>
                            <Area yAxisId="right" type="monotone" dataKey="energy" stroke="#10B981" strokeWidth={3} fill="url(#colorEnergy)" name="Energy" isAnimationActive={!loading}/>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="flex gap-3 mb-8">
                <button onClick={() => setIsAddMealModalOpen(true)} className="btn-primary flex-1 flex flex-col items-center justify-center py-4">
                    <PlusIcon className="w-6 h-6 mb-1" />
                    <span className="text-sm">Log Meal</span>
                </button>
                <button onClick={() => setIsAddJournalModalOpen(true)} className="btn-secondary flex-1 flex flex-col items-center justify-center py-4">
                    <BookIcon className="w-6 h-6 mb-1" />
                    <span className="text-sm">Daily Check-in</span>
                </button>
            </div>

            <div>
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-4">Activity Log</h3>
                {historyItems.length > 0 ? (
                    <div className="space-y-3">
                        {historyItems.map(item => {
                            const isMeal = item.type === 'meal';
                            return (
                                <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-700 animate-fade-in-up flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-xl mr-3 ${isMeal ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                                            {isMeal ? <BowlIcon className="w-5 h-5" /> : <ChartIcon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-900 dark:text-white capitalize text-sm">
                                                {isMeal ? (item as LoggedMeal).name : 'Health Check-in'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {formatTimestamp(item.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {isMeal ? (
                                            <div className="text-xs text-gray-600 dark:text-gray-300">
                                                <p className="font-bold">{(item as LoggedMeal).nutrients.calories} <span className="font-normal text-[10px]">kcal</span></p>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-600 dark:text-gray-300">
                                                <p className="font-bold">{(item as JournalEntry).weight} <span className="font-normal text-[10px]">kg</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 px-4 bg-emerald-50 dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700">
                        <p className="text-emerald-700 dark:text-gray-400 font-medium">No activity yet.</p>
                    </div>
                )}
            </div>

            {isAddMealModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsAddMealModalOpen(false)}>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl text-center w-full max-w-xs dark:bg-slate-800 animate-fade-in-up border border-emerald-100 dark:border-slate-600" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Log Meal</h2>
                        <input
                            type="text"
                            value={mealName}
                            onChange={(e) => setMealName(e.target.value)}
                            placeholder="e.g., Grilled Tilapia"
                            className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-4 focus:ring-brand-green focus:border-brand-green bg-gray-50 shadow-inner"
                        />
                        <button 
                            onClick={handleAddMeal} 
                            disabled={isAddingMeal}
                            className="btn-primary mb-3 disabled:opacity-70"
                        >
                            {isAddingMeal ? 'Analyzing...' : 'Add Meal'}
                        </button>
                        <button onClick={() => setIsAddMealModalOpen(false)} className="btn-tertiary">Cancel</button>
                    </div>
                </div>
            )}

            {isAddJournalModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsAddJournalModalOpen(false)}>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs dark:bg-slate-800 animate-fade-in-up border border-emerald-100 dark:border-slate-600" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6 dark:text-white text-center">Daily Check-in</h2>
                        <form onSubmit={handleAddJournalEntry} className="space-y-4">
                            <div>
                                <label htmlFor="weight" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Weight (kg)</label>
                                <input
                                    type="number" id="weight" name="weight" value={newJournalEntry.weight} onChange={handleJournalChange}
                                    className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-green focus:border-brand-green bg-gray-50 shadow-inner"
                                    required step="0.1"
                                />
                            </div>
                            <div>
                                <label htmlFor="energy" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Energy (1-10)</label>
                                <input
                                    type="number" id="energy" name="energy" value={newJournalEntry.energy} onChange={handleJournalChange}
                                    className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-green focus:border-brand-green bg-gray-50 shadow-inner"
                                    required min="1" max="10"
                                />
                            </div>
                            {userProfile.plan === 'Free' && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 p-3 rounded-xl flex items-start gap-3">
                                    <PremiumIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-snug">
                                        <span className="font-bold">Upgrade to Premium</span> to get exclusive feedback and interactions with a nutritionist.
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsAddJournalModalOpen(false)} className="btn-tertiary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PaymentModal: React.FC<{ onPaymentSuccess: () => void; closeModal: () => void }> = ({ onPaymentSuccess, closeModal }) => {
    const [step, setStep] = useState<'method' | 'processing' | 'success'>('method');
    const [method, setMethod] = useState<'MTN' | 'Airtel' | null>(null);
    const [phone, setPhone] = useState('');

    const handlePay = () => {
        if (!method || phone.length < 9) return;
        setStep('processing');
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onPaymentSuccess();
                closeModal();
            }, 2500);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={closeModal}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm border border-emerald-50 dark:border-slate-800 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                {step === 'method' && (
                    <>
                        <h2 className="text-2xl font-bold mb-2 text-emerald-900 dark:text-white text-center">Upgrade to Premium</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-8">Choose your payment method</p>
                        
                        <div className="space-y-4 mb-8">
                            <button 
                                onClick={() => setMethod('MTN')}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${method === 'MTN' ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 shadow-lg' : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800'}`}
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-yellow-400 rounded-lg mr-3 flex items-center justify-center font-bold text-slate-800">MTN</div>
                                    <span className="font-bold text-slate-800 dark:text-white">MTN Mobile Money</span>
                                </div>
                                {method === 'MTN' && <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}
                            </button>
                            <button 
                                onClick={() => setMethod('Airtel')}
                                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${method === 'Airtel' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg' : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800'}`}
                            >
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-red-600 rounded-lg mr-3 flex items-center justify-center font-bold text-white italic">Airtel</div>
                                    <span className="font-bold text-slate-800 dark:text-white">Airtel Money</span>
                                </div>
                                {method === 'Airtel' && <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>}
                            </button>
                        </div>

                        <div className="mb-8">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Phone Number</label>
                            <input 
                                type="tel" 
                                placeholder="07XX XXX XXX" 
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl text-lg font-bold outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-all shadow-inner"
                            />
                        </div>

                        <button 
                            disabled={!method || phone.length < 9}
                            onClick={handlePay}
                            className="btn-primary w-full disabled:opacity-50 h-14 text-lg"
                        >
                            Pay UGX 50,000 / month
                        </button>
                    </>
                )}

                {step === 'processing' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="w-24 h-24 relative mb-6">
                            <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-full animate-ping opacity-75"></div>
                            <div className="relative w-full h-full bg-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                <LogoIcon className="w-12 h-12 text-white animate-spin" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-900 dark:text-white mb-2">Processing Payment</h2>
                        <p className="text-gray-500 dark:text-gray-400">Please check your phone for a USSD push notification to confirm your PIN.</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center shadow-lg mb-6">
                             <svg className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-3xl font-bold text-emerald-900 dark:text-white mb-2">Welcome to Premium!</h2>
                        <p className="text-gray-500 dark:text-gray-400">Payment successful. You now have full access to NutriCan Live and professional nutritionists.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Live Section Utilities ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const LiveSession: React.FC<{ userProfile: UserProfile; onEnd: () => void }> = ({ userProfile, onEnd }) => {
    const [status, setStatus] = useState<'connecting' | 'active' | 'closed'>('connecting');
    const [transcript, setTranscript] = useState<{role: 'user' | 'model', text: string}[]>([]);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const sessionRef = useRef<any>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);

    const startSession = useCallback(async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('active');
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const int16 = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000'
                            };
                            sessionPromise.then(session => session.sendRealtimeInput({ media: blob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContextRef.current!.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputContextRef.current!, 24000, 1);
                            const source = outputContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContextRef.current!.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        
                        if (message.serverContent?.outputTranscription) {
                             const text = message.serverContent.outputTranscription.text;
                             setTranscript(prev => {
                                 const last = prev[prev.length - 1];
                                 if (last?.role === 'model') return [...prev.slice(0, -1), { role: 'model', text: last.text + text }];
                                 return [...prev, { role: 'model', text }];
                             });
                        }
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            setTranscript(prev => {
                                 const last = prev[prev.length - 1];
                                 if (last?.role === 'user') return [...prev.slice(0, -1), { role: 'user', text: last.text + text }];
                                 return [...prev, { role: 'user', text }];
                            });
                        }
                    },
                    onclose: () => setStatus('closed'),
                    onerror: () => setStatus('closed')
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    systemInstruction: `You are Dr. Whitney, a specialized oncology nutritionist at NutriCan. The user is ${userProfile.name}, a ${userProfile.age} year old dealing with ${userProfile.cancerType} cancer (${userProfile.cancerStage}). Their health profile includes: ${userProfile.otherConditions.join(', ')}. Provide compassionate, real-time nutrition advice based on Ugandan local foods. Keep responses concise and audible. Start by welcoming ${userProfile.name} to their live session.`
                }
            });
            sessionRef.current = await sessionPromise;
        } catch (err) {
            console.error(err);
            setStatus('closed');
        }
    }, [userProfile]);

    useEffect(() => {
        startSession();
        return () => {
            sessionRef.current?.close();
            audioContextRef.current?.close();
            outputContextRef.current?.close();
        };
    }, [startSession]);

    return (
        <div className="fixed inset-0 bg-slate-900 z-[200] flex flex-col p-6 animate-fade-in overflow-hidden">
             <div className="flex justify-between items-center mb-12">
                 <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                         <BroadcastIcon className="w-6 h-6 text-white" />
                     </div>
                     <div>
                         <h2 className="text-white font-bold text-lg">Dr. Whitney</h2>
                         <div className="flex items-center gap-1.5">
                             <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                             <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Live Session</span>
                         </div>
                     </div>
                 </div>
                 <button onClick={onEnd} className="bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all shadow-lg active:scale-95">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>

             <div className="flex-grow flex flex-col items-center justify-center relative">
                 {/* Visualizer Simulation */}
                 <div className="w-64 h-64 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-pulse-glow scale-150"></div>
                      <div className="absolute inset-0 bg-teal-500/20 rounded-full animate-pulse-glow delay-300"></div>
                      <div className="w-48 h-48 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-full shadow-2xl flex items-center justify-center border-4 border-white/10 relative z-10 overflow-hidden group">
                           <LogoIcon className="w-24 h-24 text-white opacity-80 group-hover:scale-110 transition-transform duration-700" />
                      </div>
                 </div>
                 
                 {/* Status text */}
                 <div className="mt-12 text-center">
                      {status === 'connecting' && <p className="text-emerald-400 font-bold animate-pulse text-xl">Establishing Connection...</p>}
                      {status === 'active' && <p className="text-white font-bold text-2xl tracking-tight">Listening...</p>}
                      {status === 'closed' && <p className="text-red-400 font-bold text-xl">Session Terminated</p>}
                 </div>
             </div>

             {/* Live Transcription Peek */}
             <div className="h-32 bg-white/5 backdrop-blur-md rounded-3xl p-4 mt-8 overflow-y-auto shadow-inner border border-white/10">
                 {transcript.length === 0 ? (
                      <p className="text-white/30 italic text-center text-sm py-8">Transcription will appear here...</p>
                 ) : (
                     <div className="space-y-3">
                         {transcript.map((t, i) => (
                             <p key={i} className={`text-sm ${t.role === 'user' ? 'text-teal-300 text-right' : 'text-emerald-100 text-left'} font-medium`}>
                                 <span className="opacity-50 uppercase text-[10px] block mb-0.5">{t.role === 'user' ? 'You' : 'Dr. Whitney'}</span>
                                 {t.text}
                             </p>
                         ))}
                     </div>
                 )}
             </div>

             <div className="mt-8 flex justify-center gap-6">
                 <button className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg active:scale-95 transition-all">
                      <MicIcon className="w-6 h-6" />
                 </button>
                 <button onClick={onEnd} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-glow-red active:scale-90 transition-all border-4 border-white/20">
                      <VideoCallIcon className="w-8 h-8" />
                 </button>
                 <button className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg active:scale-95 transition-all">
                      <ShareIcon className="w-6 h-6" />
                 </button>
             </div>
        </div>
    );
};

const SymptomTipsScreen: React.FC = () => {
    const SYMPTOM_STORAGE_KEY = 'nutrican_saved_symptom_tips_v2';
    const [viewingSymptom, setViewingSymptom] = useState<SymptomType | null>(null);
    const [currentTips, setCurrentTips] = useState<RecommendedFood[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [savedTips, setSavedTips] = useState<Record<string, RecommendedFood[]>>(() => {
        try {
            const saved = localStorage.getItem(SYMPTOM_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            return {};
        }
    });

    const symptomConfig = useMemo(() => ({
        [SymptomType.APPETITE_LOSS]: { icon: BowlIcon, color: 'text-sky-900', bg: 'from-sky-100 to-sky-200', border: 'border-sky-200' },
        [SymptomType.VOMITING]: { icon: NauseaIcon, color: 'text-emerald-900', bg: 'from-emerald-100 to-emerald-200', border: 'border-emerald-200' },
        [SymptomType.MOUTH_WOUNDS]: { icon: MouthSoreIcon, color: 'text-green-900', bg: 'from-green-100 to-green-200', border: 'border-green-200' },
        [SymptomType.DIARRHOEA]: { icon: BookIcon, color: 'text-amber-900', bg: 'from-amber-100 to-amber-200', border: 'border-amber-200' },
        [SymptomType.CONSTIPATION]: { icon: BookIcon, color: 'text-orange-900', bg: 'from-orange-100 to-orange-200', border: 'border-orange-200' },
        [SymptomType.INFECTION_RISK]: { icon: PremiumIcon, color: 'text-rose-900', bg: 'from-rose-100 to-rose-200', border: 'border-rose-200' },
        [SymptomType.SOUR_MOUTH]: { icon: MouthSoreIcon, color: 'text-violet-900', bg: 'from-violet-100 to-violet-200', border: 'border-violet-200' },
    }), []);

    const fetchAndSetTips = useCallback(async (symptom: SymptomType) => {
        setLoading(true);
        setCurrentTips(null);
        const tips = await getSymptomTips(symptom);
        setCurrentTips(tips);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!viewingSymptom || (savedTips[viewingSymptom])) return;
        fetchAndSetTips(viewingSymptom);
    }, [viewingSymptom, savedTips, fetchAndSetTips]);

    const handleSaveTips = () => {
        if (!viewingSymptom || !currentTips) return;
        const newSavedTips = { ...savedTips, [viewingSymptom]: currentTips };
        setSavedTips(newSavedTips);
        localStorage.setItem(SYMPTOM_STORAGE_KEY, JSON.stringify(newSavedTips));
        alert("Tips saved!");
    };
    
    const handleViewSymptom = (symptom: SymptomType) => {
        if (savedTips[symptom]) {
            setCurrentTips(savedTips[symptom]);
        }
        setViewingSymptom(symptom);
    };

    if (viewingSymptom) {
        return (
            <div className="p-6 animate-fade-in min-h-full">
                <button onClick={() => setViewingSymptom(null)} className="btn-small-gradient mb-4 inline-flex items-center gap-2"><span>&larr; Back</span></button>
                <h2 className="text-2xl font-bold mb-4 dark:text-white text-emerald-900">Tips for {viewingSymptom}</h2>
                {loading && <div className="text-center p-8"><LogoIcon className="animate-spin h-10 w-10 mx-auto text-emerald-600" /></div>}
                {currentTips && (
                    <div className="space-y-4 animate-fade-in-up">
                        {currentTips.map((food, index) => (
                            <div key={index} className="flex items-start bg-white p-4 rounded-2xl shadow-md border border-emerald-50 dark:bg-slate-800 dark:border-slate-700">
                                <img src={food.photoUrl} alt={food.name} className="w-20 h-20 rounded-xl object-cover mr-4 shadow-sm" />
                                <div>
                                    <h3 className="font-bold text-lg text-emerald-900 dark:text-emerald-100">{food.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug mt-1">{food.description}</p>
                                </div>
                            </div>
                        ))}
                        <div className="flex gap-2 mt-6">
                            <button onClick={handleSaveTips} className="btn-primary flex-1">Save Tips</button>
                             <button onClick={() => fetchAndSetTips(viewingSymptom)} className="btn-secondary flex-1">Refresh Ideas</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-emerald-900 dark:text-white">Symptom Tips</h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">Select a symptom for food recommendations.</p>
            <div className="space-y-4">
                {Object.values(SymptomType).map(symptom => {
                    const config = symptomConfig[symptom];
                    return (
                        <button key={symptom} onClick={() => handleViewSymptom(symptom)} className={`flex items-center w-full text-left p-5 rounded-2xl shadow-button hover:shadow-button-hover active:scale-95 transition-all border bg-gradient-to-r ${config.bg} ${config.border} relative overflow-hidden`}>
                            <div className="p-2 bg-white/80 rounded-full mr-4 shadow-sm dark:bg-slate-800/80 relative z-10"><config.icon className={`w-6 h-6 ${config.color}`} /></div>
                            <span className={`font-bold text-lg flex-grow ${config.color} relative z-10`}>{symptom}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{ isEnabled: boolean; onToggle: () => void; color: string; }> = ({ isEnabled, onToggle, color }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={isEnabled} onChange={onToggle} className="sr-only peer" />
      <div className={`w-11 h-6 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner ${isEnabled ? color : ''}`}></div>
    </label>
);

const RemindersScreen: React.FC = () => {
    const [reminders, setReminders] = useState([
        { id: 1, title: 'Drink Water', description: 'Every 2 hours', isEnabled: true },
        { id: 2, title: 'Take Medication', description: 'After lunch', isEnabled: true },
        { id: 3, title: 'Log Meal', description: 'At 8 PM', isEnabled: false },
    ]);
    const toggleReminder = (id: number) => setReminders(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    return (
        <div className="p-6 animate-fade-in pb-8">
            <h2 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Reminders</h2>
            <div className="space-y-4">
                {reminders.map(r => (
                    <div key={r.id} className={`p-5 rounded-2xl flex items-center justify-between shadow-sm border ${r.isEnabled ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                        <div className="flex items-center">
                            <div className={`p-2 rounded-xl mr-4 ${r.isEnabled ? 'bg-white/20' : 'bg-emerald-100'}`}><BellIcon className="w-6 h-6" /></div>
                            <div><h3 className="font-bold">{r.title}</h3><p className="text-xs opacity-80">{r.description}</p></div>
                        </div>
                        <ToggleSwitch isEnabled={r.isEnabled} onToggle={() => toggleReminder(r.id)} color="bg-emerald-500" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const LibraryScreen: React.FC = () => {
  const documents = [
    { title: "Nutrition Basics", desc: "Guide to recovery diet.", size: "2.4 MB", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/640px-Good_Food_Display_-_NCI_Visuals_Online.jpg" },
    { title: "Chemo Side Effects", desc: "Tips for nausea & fatigue.", size: "1.8 MB", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Pill_bottle_and_pills.jpg/640px-Pill_bottle_and_pills.jpg" },
  ];
  return (
    <div className="p-6 animate-fade-in pb-24">
      <h1 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Library</h1>
      <div className="grid grid-cols-1 gap-4">
        {documents.map((doc, i) => (
          <div key={i} className="flex bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md border border-emerald-50 dark:border-slate-700 overflow-hidden">
             <img src={doc.img} alt={doc.title} className="w-20 h-24 object-cover rounded-xl" />
             <div className="ml-4 flex flex-col justify-between flex-grow">
                <div><h3 className="font-bold text-emerald-900 dark:text-white text-lg">{doc.title}</h3><p className="text-xs text-gray-500">{doc.desc}</p></div>
                <div className="flex items-center justify-between mt-2"><span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">{doc.size}</span><button className="text-emerald-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg></button></div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Doctor Connect Feature Components ---

const AVAILABLE_DOCTORS: DoctorProfile[] = [
    {
        id: 'dr_whitney',
        name: 'Dr. Whitney',
        specialty: 'Oncology Nutrition Specialist',
        image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
        personality: 'Compassionate, warm, and highly empathetic. Uses terms like "my dear" and focuses on emotional well-being alongside food.',
        greeting: "Hello dear, I'm Dr. Whitney. I'm here to support you with gentle nourishment plans. How are you feeling today?",
        isOnline: true,
    },
    {
        id: 'dr_dorcas',
        name: 'Dr. Dorcas',
        specialty: 'Clinical Dietitian',
        image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80',
        personality: 'Clinical, precise, scientific, and direct. Focuses on nutrient density, percentages, and medical facts.',
        greeting: "Good day. I am Dr. Dorcas. Let's look at your nutritional data and optimize your intake for recovery.",
        isOnline: false,
    },
    {
        id: 'dr_liz',
        name: 'Dr. Liz',
        specialty: 'Integrative Health Coach',
        image: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=400&q=80',
        personality: 'Holistic, traditional, and nature-focused. Recommends local herbs, natural remedies, and lifestyle balance.',
        greeting: "Hi! I'm Dr. Liz. Healing comes from nature. Let's talk about local foods and how to balance your energy.",
        isOnline: true,
    }
];

const ChatInterface: React.FC<{ doctor: DoctorProfile, userProfile: UserProfile, onBack: () => void }> = ({ doctor, userProfile, onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: doctor.greeting, timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Call Gemini
        const replyText = await getDoctorChatResponse(doctor, userProfile, [...messages, userMsg], input);

        const doctorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: replyText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, doctorMsg]);
        setIsTyping(false);
    };

    const handleShareVitals = () => {
        const bmi = userProfile.height && userProfile.weight 
            ? (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1) 
            : "Unknown";
            
        const report = `[Health Report Shared]
        Patient: ${userProfile.name}
        BMI: ${bmi}
        Weight: ${userProfile.weight}kg
        Stage: ${userProfile.cancerStage}
        Please analyze this.`;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: "I'm sharing my latest health snapshot with you.",
            timestamp: new Date(),
            isSystem: true
        };
        
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Invisible system prompt to AI
        getDoctorChatResponse(doctor, userProfile, [...messages, { ...userMsg, text: report }], report)
            .then(replyText => {
                const doctorMsg: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: replyText,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, doctorMsg]);
                setIsTyping(false);
            });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 animate-fade-in relative z-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 shadow-sm flex items-center justify-between border-b dark:border-slate-700">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                        <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div className="relative">
                        <img src={doctor.image} alt={doctor.name} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-100" />
                        {doctor.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>}
                    </div>
                    <div className="ml-3">
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm">{doctor.name}</h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{doctor.specialty}</p>
                    </div>
                </div>
                <button className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
                   <VideoCallIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-24">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm relative ${
                            msg.role === 'user' 
                                ? msg.isSystem 
                                    ? 'bg-blue-50 border border-blue-200 text-blue-800 rounded-br-none'
                                    : 'bg-emerald-600 text-white rounded-br-none' 
                                : 'bg-white dark:bg-slate-800 dark:text-gray-200 border dark:border-slate-700 rounded-bl-none'
                        }`}>
                            {msg.isSystem && (
                                <div className="flex items-center gap-2 mb-1 border-b border-blue-200 pb-1">
                                    <ChartIcon className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase">System Info</span>
                                </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${msg.role === 'user' && !msg.isSystem ? 'text-emerald-100' : 'text-gray-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                         <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm border dark:border-slate-700 flex space-x-1">
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 p-3 border-t dark:border-slate-700 flex flex-col gap-2 shadow-lg">
                {/* Quick Actions */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button onClick={handleShareVitals} className="whitespace-nowrap px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-800 flex items-center gap-1 active:scale-95 transition-transform">
                        <ChartIcon className="w-3 h-3" />
                        Share Vitals
                    </button>
                    <button className="whitespace-nowrap px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 text-xs font-bold rounded-full border border-orange-100 dark:border-orange-800 flex items-center gap-1 active:scale-95 transition-transform">
                        <BowlIcon className="w-3 h-3" />
                        Share Meal Log
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
                        <PlusIcon className="w-6 h-6" />
                    </button>
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-grow bg-gray-100 dark:bg-slate-700 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                    />
                    <button onClick={handleSend} disabled={!input.trim()} className="p-2.5 bg-emerald-600 rounded-full text-white shadow-md disabled:opacity-50 disabled:shadow-none active:scale-95 transition-all">
                        <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const DoctorConnectScreen: React.FC<{ userProfile: UserProfile; onUpgradeRequest: () => void }> = ({ userProfile, onUpgradeRequest }) => {
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);

    // If not premium, show upgrade gate
    if (userProfile.plan !== 'Premium') {
        return (
            <div className="p-6 text-center flex flex-col items-center justify-center min-h-full animate-fade-in pb-24">
                <h1 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Doctor Connect</h1>
                <div className="border border-emerald-200 p-6 rounded-2xl dark:border-emerald-800 w-full bg-white/80 dark:bg-slate-800/80 shadow-xl backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-emerald-100 to-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 dark:from-emerald-900"><PremiumIcon className="w-10 h-10 text-emerald-600" /></div>
                    <h2 className="text-xl font-bold text-emerald-900 dark:text-white mb-2">Unlock Professional Care</h2>
                    <p className="text-gray-600 mb-6 dark:text-gray-400 text-sm">Get expert guidance tailored to your journey.</p>
                    <button onClick={onUpgradeRequest} className="btn-primary shadow-glow-primary w-full group relative overflow-hidden"><span className="relative z-10">Upgrade to Premium</span></button>
                </div>
            </div>
        );
    }

    // If Chat Active
    if (selectedDoctor) {
        return <ChatInterface doctor={selectedDoctor} userProfile={userProfile} onBack={() => setSelectedDoctor(null)} />;
    }

    // Doctor Selection View
    return (
        <div className="p-6 h-full flex flex-col animate-fade-in pb-24">
            <h1 className="text-3xl font-bold mb-2 text-emerald-900 dark:text-white">Doctor Connect</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Choose a specialist to chat with.</p>
            
            <div className="space-y-4 animate-stagger-children">
                {AVAILABLE_DOCTORS.map((doctor, index) => (
                    <div key={doctor.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-700 flex items-start gap-4 transition-transform active:scale-[0.98]" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="relative flex-shrink-0">
                            <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                            {doctor.isOnline && (
                                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white dark:border-slate-800"></span>
                                </span>
                            )}
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-emerald-900 dark:text-white">{doctor.name}</h3>
                                {doctor.isOnline && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase">Online</span>}
                            </div>
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">{doctor.specialty}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">{doctor.personality}</p>
                            <button 
                                onClick={() => setSelectedDoctor(doctor)}
                                className="mt-3 w-full py-2 bg-emerald-50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 text-sm font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <ChatBubbleIcon className="w-4 h-4" />
                                Start Chat
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LiveScreen: React.FC<{ userProfile: UserProfile; onUpgradeRequest: () => void }> = ({ userProfile, onUpgradeRequest }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);

    if (userProfile.plan !== 'Premium') {
        return (
            <div className="p-6 animate-fade-in flex flex-col items-center justify-center h-full pb-24 text-center">
                 <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 rounded-3xl flex items-center justify-center shadow-lg mb-6"><BroadcastIcon className="w-12 h-12 text-gray-400" /></div>
                 <h1 className="text-4xl font-bold text-emerald-900 dark:text-white mb-2">NutriCan Live</h1>
                 <p className="text-gray-500 mb-8 max-w-xs">Live audio/video consultations with Dr. Whitney are exclusive to Premium members.</p>
                 <button onClick={onUpgradeRequest} className="btn-primary w-full">Unlock Live Features</button>
            </div>
        );
    }

    if (isSessionActive) {
        return <LiveSession userProfile={userProfile} onEnd={() => setIsSessionActive(false)} />;
    }

    return (
        <div className="p-6 animate-fade-in flex flex-col h-full pb-24 text-center items-center justify-center">
             <div className="w-32 h-32 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-full flex items-center justify-center shadow-glow-primary-md mb-8 animate-pulse-glow"><BroadcastIcon className="w-16 h-16 text-white" /></div>
             <h1 className="text-3xl font-bold text-emerald-900 dark:text-white mb-2">Ready to Connect?</h1>
             <p className="text-emerald-700 dark:text-emerald-400 mb-8">Dr. Whitney is available for a real-time nutrition session.</p>
             <button onClick={() => setIsSessionActive(true)} className="btn-primary w-full py-5 text-xl">Start Live Interaction</button>
        </div>
    );
};


const ProfileScreen: React.FC<{ userProfile: UserProfile, onLogout: () => void }> = ({ userProfile, onLogout }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const bmi = useMemo(() => {
        if (userProfile.height && userProfile.weight) {
            return (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1);
        }
        return 'N/A';
    }, [userProfile.height, userProfile.weight]);
    
    return (
        <div className="p-6 animate-fade-in">
            <div className="flex flex-col items-center mb-8">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg mb-4">
                     <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center"><UserIcon className="w-14 h-14 text-emerald-600" /></div>
                </div>
                <h2 className="text-2xl font-bold dark:text-white text-emerald-900">{userProfile.name}</h2>
                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${userProfile.plan === 'Premium' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800'}`}>
                    {userProfile.plan} Plan
                </div>
                <div className="w-full grid grid-cols-3 gap-2 mt-6">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-emerald-50 dark:border-slate-700 text-center"><p className="text-xs text-gray-500 uppercase font-bold">Height</p><p className="font-bold">{userProfile.height}cm</p></div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-emerald-50 dark:border-slate-700 text-center"><p className="text-xs text-gray-500 uppercase font-bold">Weight</p><p className="font-bold">{userProfile.weight}kg</p></div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-emerald-50 dark:border-slate-700 text-center"><p className="text-xs text-gray-500 uppercase font-bold">BMI</p><p className="font-bold">{bmi}</p></div>
                </div>
            </div>
            <div className="space-y-3">
                <button className="btn-tertiary w-full !justify-between !px-6"><span>Edit Profile</span><span>&rarr;</span></button>
                <button onClick={toggleTheme} className="btn-tertiary w-full !justify-between !px-6"><span>Theme</span><span className="bg-white/20 px-2 py-0.5 rounded text-xs uppercase font-bold">{theme}</span></button>
                <button onClick={onLogout} className="btn-primary w-full mt-6 !bg-slate-800 !border-slate-700">Log Out</button>
            </div>
        </div>
    );
};


// --- Main Dashboard Container ---

interface DashboardProps {
  userProfile: UserProfile;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onLogout }) => {
  const [activePage, setActivePage] = useState<DashboardPage>('home');
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [localProfile, setLocalProfile] = useState(userProfile);

  const handlePaymentSuccess = async () => {
      try {
          const user = auth.currentUser;
          if (user) {
              await db.upgradeToPremium(user.uid);
              setLocalProfile(prev => ({ ...prev, plan: 'Premium' }));
          }
      } catch (err) {
          console.error(err);
      }
  };

  const pages = useMemo(() => ({
    home: <HomeScreen userProfile={localProfile} setActivePage={setActivePage} setModal={setModalContent} />,
    tracker: <TrackerScreen userProfile={localProfile} />,
    live: <LiveScreen userProfile={localProfile} onUpgradeRequest={() => setShowPayment(true)} />,
    library: <LibraryScreen />,
    'doctor-connect': <DoctorConnectScreen userProfile={localProfile} onUpgradeRequest={() => setShowPayment(true)} />,
    profile: <ProfileScreen userProfile={localProfile} onLogout={onLogout} />,
  }), [localProfile, onLogout]);

  const CurrentPage = pages[activePage] || pages.home;

  return (
    <div className="pb-24 relative min-h-screen bg-transparent">
      <div className="pt-4">{CurrentPage}</div>
      <EmergencyButton activePage={activePage} />
      <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
      {modalContent && <Modal closeModal={() => setModalContent(null)}>{modalContent}</Modal>}
      {showPayment && <PaymentModal onPaymentSuccess={handlePaymentSuccess} closeModal={() => setShowPayment(false)} />}
    </div>
  );
};

export default Dashboard;
