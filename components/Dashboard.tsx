import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { UserProfile, DashboardPage, WeeklyMealPlan, FoodSafetyStatus, FoodSafetyResult, Meal, NutrientInfo, SymptomType, RecommendedFood, JournalEntry, LoggedMeal } from '../types';
import { HomeIcon, ChartIcon, BookIcon, PremiumIcon, UserIcon, SearchIcon, LogoIcon, ProteinIcon, CarbsIcon, BalancedIcon, BowlIcon, PlusIcon, NauseaIcon, MouthSoreIcon, BellIcon, ChatBubbleIcon, VideoCallIcon, ShareIcon } from './Icons';
import { checkFoodSafety, generateMealPlan, swapMeal, getNutrientInfo, getSymptomTips } from '../services/geminiService';
import { db } from '../services/db';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ThemeContext } from '../contexts/ThemeContext';

// --- Reusable UI Components ---

const BottomNavBar: React.FC<{ activePage: DashboardPage; onNavigate: (page: DashboardPage) => void }> = ({ activePage, onNavigate }) => {
  const navItems = [
    { page: 'home' as DashboardPage, icon: HomeIcon, label: 'Home' },
    { page: 'tracker' as DashboardPage, icon: ChartIcon, label: 'Tracker' },
    { page: 'library' as DashboardPage, icon: BookIcon, label: 'Library' },
    { page: 'doctor-connect' as DashboardPage, icon: PremiumIcon, label: 'Doctor' },
    { page: 'profile' as DashboardPage, icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white/95 backdrop-blur-xl border-t border-emerald-100 flex justify-around p-2 dark:bg-slate-900/95 dark:border-slate-700 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
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
  
  // Hide the SOS button on the tracker page to avoid overlap with the "Add Meal" button.
  if (activePage === 'tracker') {
    return null;
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="fixed bottom-24 right-4 bg-gradient-to-b from-red-500 to-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center text-lg font-bold z-50 animate-pulse transition-all hover:scale-105 active:scale-95 active:translate-y-1 border border-white/20 relative overflow-hidden" style={{ boxShadow: '0 4px 0 #7f1d1d, 0 8px 10px rgba(0,0,0,0.3)' }}>
        <span className="relative z-10 drop-shadow-md">SOS</span>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2 pointer-events-none rounded-full"></div>
      </button>
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
        { name: 'Nutrient Tracker', icon: ChartIcon, action: () => setModal(<NutrientTrackerScreen />) },
        { name: 'Symptom-Based Tips', icon: NauseaIcon, action: () => setModal(<SymptomTipsScreen />) },
        { name: 'Progress Journal', icon: BookIcon, action: () => setActivePage('tracker') },
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
        }, 5000); // Change image every 5 seconds for a smoother effect

        return () => clearInterval(intervalId); // Cleanup on component unmount
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

const NutrientTrackerScreen: React.FC = () => {
    const NUTRIENT_LOG_KEY = 'nutrican_nutrient_log';

    const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>(() => {
        try {
            const saved = localStorage.getItem(NUTRIENT_LOG_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Failed to parse nutrient log:", error);
            return [];
        }
    });

    const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
    const [mealName, setMealName] = useState('');
    const [isAddingMeal, setIsAddingMeal] = useState(false);

    useEffect(() => {
        localStorage.setItem(NUTRIENT_LOG_KEY, JSON.stringify(loggedMeals));
    }, [loggedMeals]);

    const totalNutrients = useMemo<NutrientInfo>(() => {
        return loggedMeals.reduce((acc, meal) => {
            if (meal.nutrients) {
                acc.calories += meal.nutrients.calories || 0;
                acc.sugar += meal.nutrients.sugar || 0;
                acc.salt += meal.nutrients.salt || 0;
            }
            return acc;
        }, { calories: 0, sugar: 0, salt: 0 });
    }, [loggedMeals]);

    const nutrientData = [
        { name: 'Calories', value: totalNutrients.calories, goal: 2000, unit: 'kcal', color: '#22C55E' },
        { name: 'Sugar', value: totalNutrients.sugar, goal: 50, unit: 'g', color: '#14B8A6' },
        { name: 'Salt', value: totalNutrients.salt, goal: 2.3, unit: 'g', color: '#A3E635' },
    ];
    
    const handleAddMeal = async () => {
        if (!mealName.trim()) return;
        setIsAddingMeal(true);
        const result = await getNutrientInfo(mealName);
        if (result) {
            const newMeal: LoggedMeal = {
                id: Date.now().toString(),
                name: mealName,
                nutrients: result,
                timestamp: new Date().toISOString(),
            };
            setLoggedMeals(prev => [...prev, newMeal]);
            setMealName('');
            setIsAddMealModalOpen(false);
        } else {
            alert("Could not get nutrient information for this meal. Please try again.");
        }
        setIsAddingMeal(false);
    };

    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-6 animate-fade-in relative min-h-full">
            <h2 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Nutrients</h2>
            <div className="grid grid-cols-3 gap-2 text-center mb-6">
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
            
            <div className="mt-8">
                <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mb-4">Today's Log</h3>
                {loggedMeals.length > 0 ? (
                    <div className="space-y-3">
                        {loggedMeals.slice().reverse().map(meal => (
                            <div key={meal.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-700 flex justify-between items-center animate-fade-in-up">
                                <div>
                                    <p className="font-bold text-lg text-emerald-900 dark:text-white capitalize">{meal.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(meal.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} - {formatTimestamp(meal.timestamp)}</p>
                                </div>
                                <div className="text-right text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                                    <p>Cal: <span className="font-bold">{meal.nutrients.calories}</span></p>
                                    <p>Sug: <span className="font-bold">{meal.nutrients.sugar.toFixed(1)}g</span></p>
                                    <p>Salt: <span className="font-bold">{meal.nutrients.salt.toFixed(1)}g</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 px-4 bg-emerald-50 dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700">
                        <BowlIcon className="w-12 h-12 mx-auto text-emerald-300 dark:text-slate-600" />
                        <p className="mt-2 text-emerald-700 dark:text-gray-400 font-medium">No meals logged yet.</p>
                        <p className="text-xs text-emerald-600 dark:text-gray-500">Tap 'Log a Meal' below to add your first meal.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-8">
                <button
                    onClick={() => setIsAddMealModalOpen(true)}
                    className="btn-primary"
                    aria-label="Log a Meal"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Log a Meal
                </button>
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
        </div>
    );
};

const SymptomTipsScreen: React.FC = () => {
    const SYMPTOM_STORAGE_KEY = 'nutrican_saved_symptom_tips';

    const [viewingSymptom, setViewingSymptom] = useState<SymptomType | null>(null);
    const [currentTips, setCurrentTips] = useState<RecommendedFood[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [savedTips, setSavedTips] = useState<Record<string, RecommendedFood[]>>(() => {
        try {
            const saved = localStorage.getItem(SYMPTOM_STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error("Failed to parse saved tips:", error);
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

    const isCurrentTipSaved = viewingSymptom && savedTips[viewingSymptom] && JSON.stringify(savedTips[viewingSymptom]) === JSON.stringify(currentTips);

    if (viewingSymptom) {
        return (
            <div className="p-6 animate-fade-in min-h-full">
                <button onClick={() => setViewingSymptom(null)} className="btn-small-gradient mb-4 inline-flex items-center gap-2">
                    <span>&larr; Back</span>
                </button>
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
                        <button 
                            onClick={handleSaveTips}
                            disabled={isCurrentTipSaved}
                            className="btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCurrentTipSaved ? 'Saved to Profile' : 'Save Tips'}
                        </button>
                    </div>
                )}
                
                {!loading && !currentTips && <p className="text-center text-red-500 p-8">Could not load tips. Please try again.</p>}
            </div>
        );
    }

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-emerald-900 dark:text-white">Symptom Tips</h2>
            <p className="text-gray-600 mb-6 dark:text-gray-400">Select a symptom to get personalized food recommendations.</p>
            <div className="space-y-4">
                {Object.values(SymptomType).map(symptom => {
                    const config = symptomConfig[symptom];
                    return (
                        <button 
                            key={symptom} 
                            onClick={() => handleViewSymptom(symptom)}
                            className={`flex items-center w-full text-left p-5 rounded-2xl shadow-button hover:shadow-button-hover active:scale-95 active:shadow-button-active transition-all duration-300 border bg-gradient-to-r ${config.bg} ${config.border} relative overflow-hidden`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none"></div>
                            <div className={`p-2 bg-white/80 rounded-full mr-4 shadow-sm dark:bg-slate-800/80 relative z-10`}>
                                <config.icon className={`w-6 h-6 ${config.color}`} />
                            </div>
                            <span className={`font-bold text-lg flex-grow ${config.color} relative z-10`}>{symptom}</span>
                            <span className={`text-xl font-bold ${config.color} relative z-10`}>&rarr;</span>
                        </button>
                    )
                })}
            </div>

            {Object.keys(savedTips).length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-3 text-emerald-900 dark:text-white border-t border-emerald-100 pt-4 dark:border-slate-700">Saved</h3>
                    <div className="space-y-2">
                        {Object.keys(savedTips).map(symptom => (
                            <button 
                                key={symptom} 
                                onClick={() => handleViewSymptom(symptom as SymptomType)}
                                className="btn-secondary w-full text-left flex justify-between items-center h-12"
                            >
                                <span>{symptom}</span>
                                <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">View</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProgressJournalScreen: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    const GUEST_JOURNAL_KEY = 'nutrican_journal_data_guest';
    const isGuest = !userProfile.email;

    const createInitialGuestData = (): JournalEntry[] => {
        const today = new Date();
        const data: JournalEntry[] = [];
        for (let i = 4; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const timestamp = date.toISOString();
            data.push({
                id: timestamp,
                timestamp,
                name: date.toLocaleDateString(undefined, { weekday: 'short' }),
                weight: parseFloat((70 - i * 0.2 + Math.random()).toFixed(1)),
                energy: 7 + (i % 2 === 0 ? 1 : -1) * (Math.floor(Math.random() * 2)),
                bp: 120 + (i % 2 === 0 ? -2 : 2) * (Math.floor(Math.random() * 3)),
                notes: i === 2 ? 'Felt a bit nauseous after lunch today.' : undefined,
            });
        }
        return data;
    };

    const [journalData, setJournalData] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(!isGuest);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEntry, setNewEntry] = useState({ weight: '', bp: '', energy: '', notes: '' });

    const fetchJournalData = useCallback(async () => {
        if (isGuest) {
            try {
                const saved = localStorage.getItem(GUEST_JOURNAL_KEY);
                setJournalData(saved ? JSON.parse(saved) : createInitialGuestData());
            } catch (error) {
                console.error("Failed to parse guest journal data:", error);
                setJournalData(createInitialGuestData());
            }
            return;
        }

        setLoading(true);
        try {
            const entries = await db.getJournalEntries();
            setJournalData(entries);
        } catch (error) {
            console.error("Failed to fetch journal entries:", error);
            alert("Could not load your journal. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, [isGuest]);

    useEffect(() => {
        fetchJournalData();
    }, [fetchJournalData]);

    useEffect(() => {
        if (isGuest) {
            localStorage.setItem(GUEST_JOURNAL_KEY, JSON.stringify(journalData));
        }
    }, [journalData, isGuest]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        const weight = parseFloat(newEntry.weight);
        const bp = parseInt(newEntry.bp, 10);
        const energy = parseInt(newEntry.energy, 10);
        const notes = newEntry.notes.trim();

        if (isNaN(weight) || isNaN(bp) || isNaN(energy) || energy < 1 || energy > 10) {
            alert("Please enter valid numbers. Energy must be 1-10.");
            return;
        }

        const resetForm = () => {
            setNewEntry({ weight: '', bp: '', energy: '', notes: '' });
            setIsModalOpen(false);
        };
        
        if (isGuest) {
            const now = new Date();
            const entry: JournalEntry = {
                id: now.toISOString(),
                timestamp: now.toISOString(),
                name: now.toLocaleDateString(undefined, { weekday: 'short' }),
                weight, bp, energy, notes: notes || undefined,
            };
            setJournalData(prev => [...prev, entry].slice(-30));
            resetForm();
            return;
        }

        try {
            const entryData = { weight, bp, energy, notes: notes || undefined };
            await db.addJournalEntry(entryData);
            resetForm();
            fetchJournalData();
        } catch (error) {
            console.error("Failed to add journal entry:", error);
            alert("Could not save your entry. Please try again.");
        }
    };

    return (
        <div className="p-6 animate-fade-in pb-24">
            <h2 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Journal</h2>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-700 mb-6 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl z-10">
                        <LogoIcon className="animate-spin h-8 w-8 text-emerald-600"/>
                    </div>
                )}
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={journalData.slice(-7).reverse()}>
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
            
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Recent Entries</h3>
                    <button onClick={() => setIsModalOpen(true)} className="btn-small-gradient">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Entry
                    </button>
                </div>
                {loading ? null : journalData.length > 0 ? (
                    <div className="space-y-3">
                        {journalData.map(entry => (
                            <div key={entry.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-emerald-50 dark:border-slate-700 animate-fade-in-up">
                                <p className="font-bold text-lg text-emerald-900 dark:text-white mb-2">{new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                
                                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">WEIGHT</p>
                                        <p className="text-lg font-bold text-emerald-900 dark:text-white">{entry.weight.toFixed(1)} <span className="text-xs">kg</span></p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">ENERGY</p>
                                        <p className="text-lg font-bold text-emerald-900 dark:text-white">{entry.energy}/10</p>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">BP</p>
                                        <p className="text-lg font-bold text-emerald-900 dark:text-white">{entry.bp}</p>
                                    </div>
                                </div>

                                {entry.notes && (
                                    <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-slate-700">
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{entry.notes}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-8 px-4 bg-emerald-50 dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-slate-700">
                        <BookIcon className="w-12 h-12 mx-auto text-emerald-300 dark:text-slate-600" />
                        <p className="mt-2 text-emerald-700 dark:text-gray-400 font-medium">No entries yet.</p>
                        <p className="text-xs text-emerald-600 dark:text-gray-500">Add your first entry to start tracking.</p>
                    </div>
                )}
            </div>
        
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-xs dark:bg-slate-800 animate-fade-in-up border border-emerald-100 dark:border-slate-600" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-6 dark:text-white text-center">New Entry</h2>
                        <form onSubmit={handleAddEntry} className="space-y-4">
                            <div>
                                <label htmlFor="weight" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Weight (kg)</label>
                                <input
                                    type="number" id="weight" name="weight" value={newEntry.weight} onChange={handleInputChange}
                                    className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-green focus:border-brand-green bg-gray-50 shadow-inner"
                                    required step="0.1"
                                />
                            </div>
                            <div>
                                <label htmlFor="bp" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">BP (Systolic)</label>
                                <input
                                    type="number" id="bp" name="bp" value={newEntry.bp} onChange={handleInputChange}
                                    className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-green focus:border-brand-green bg-gray-50 shadow-inner"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="energy" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Energy (1-10)</label>
                                <input
                                    type="number" id="energy" name="energy" value={newEntry.energy} onChange={handleInputChange}
                                    className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-green focus:border-brand-green bg-gray-50 shadow-inner"
                                    required min="1" max="10"
                                />
                            </div>
                             <div>
                                <label htmlFor="notes" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                                <textarea
                                    id="notes" name="notes" value={newEntry.notes} onChange={handleInputChange}
                                    placeholder="How are you feeling? Any food reactions?"
                                    rows={3}
                                    className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-green focus:border-brand-green bg-gray-50 shadow-inner"
                                />
                            </div>
                            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl text-sm text-teal-900 dark:text-teal-100 shadow-sm flex items-start gap-2">
                                <PremiumIcon className="w-5 h-5 mt-0.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                                <p className="opacity-90">Upgrade to <span className="font-bold">Premium</span> to have your journal reviewed by a certified nutritionist.</p>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-tertiary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex-1">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ToggleSwitch: React.FC<{ isEnabled: boolean; onToggle: () => void; color: string; }> = ({ isEnabled, onToggle, color }) => {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={isEnabled} onChange={onToggle} className="sr-only peer" />
          <div className={`w-11 h-6 bg-gray-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner ${isEnabled ? color : ''}`}></div>
        </label>
    );
};

const ReminderCard: React.FC<{
    title: string;
    description: string;
    isEnabled: boolean;
    onToggle: () => void;
}> = ({ title, description, isEnabled, onToggle }) => {
    const baseClasses = "p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 border relative overflow-hidden";
    const onClasses = "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-700 text-white shadow-lg shadow-emerald-500/20";
    const offClasses = "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700";

    return (
        <div className={`${baseClasses} ${isEnabled ? onClasses : offClasses}`}>
            {isEnabled && <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2 pointer-events-none"></div>}
            <div className="flex items-center relative z-10">
                <div className={`p-2 rounded-xl mr-4 transition-colors ${isEnabled ? 'bg-white/20' : 'bg-emerald-100 dark:bg-slate-700'}`}>
                    <BellIcon className={`w-6 h-6 transition-colors ${isEnabled ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                </div>
                <div>
                    <h3 className={`font-bold text-lg transition-colors ${isEnabled ? 'text-white' : 'text-emerald-900 dark:text-white'}`}>{title}</h3>
                    <p className={`text-xs font-medium transition-colors ${isEnabled ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>
                </div>
            </div>
            <div className="relative z-10">
                <ToggleSwitch isEnabled={isEnabled} onToggle={onToggle} color="bg-emerald-500" />
            </div>
        </div>
    );
};

const RemindersScreen: React.FC = () => {
    const REMINDERS_STORAGE_KEY = 'nutrican_reminders_settings';

    const [reminders, setReminders] = useState(() => {
        try {
            const saved = localStorage.getItem(REMINDERS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : { meal: false, water: false, medication: false };
        } catch (error) {
            console.error("Failed to parse reminder settings:", error);
            return { meal: false, water: false, medication: false };
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
        } catch (error) {
            console.error("Failed to save reminder settings:", error);
        }
    }, [reminders]);

    const handleToggle = (reminderType: 'meal' | 'water' | 'medication') => {
        setReminders(prev => ({ ...prev, [reminderType]: !prev[reminderType] }));
    };
    
    const reminderConfig = [
        {
            key: 'meal' as const,
            title: "Meal Times",
            description: "Remind me every 3 hours",
        },
        {
            key: 'water' as const,
            title: "Hydration",
            description: "Drink water every hour",
        },
        {
            key: 'medication' as const,
            title: "Medication",
            description: "Morning and Evening pills",
        },
    ];

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Alerts</h2>
            <div className="space-y-4">
                {reminderConfig.map(config => (
                    <ReminderCard
                        key={config.key}
                        title={config.title}
                        description={config.description}
                        isEnabled={reminders[config.key]}
                        onToggle={() => handleToggle(config.key)}
                    />
                ))}
            </div>
        </div>
    );
};

const LibraryScreen: React.FC = () => {
  const documents = [
    {
        title: "Nutrition Basics",
        desc: "A comprehensive guide to understanding macronutrients and their role in cancer recovery.",
        size: "2.4 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/640px-Good_Food_Display_-_NCI_Visuals_Online.jpg"
    },
    {
        title: "Chemo Side Effects",
        desc: "Practical tips for managing nausea, fatigue, and appetite changes during chemotherapy.",
        size: "1.8 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Pill_bottle_and_pills.jpg/640px-Pill_bottle_and_pills.jpg"
    },
    {
        title: "Hydration & Health",
        desc: "Why water is critical for your recovery and how to stay hydrated when you don't feel like drinking.",
        size: "1.2 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Glass_of_water.jpg/640px-Glass_of_water.jpg"
    },
    {
        title: "Food Safety Guide",
        desc: "Critical hygiene practices to avoid infection when your immune system is compromised.",
        size: "3.1 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Washing_hands_002.jpg/640px-Washing_hands_002.jpg"
    },
    {
        title: "Understanding BMI",
        desc: "What your Body Mass Index means for your treatment plan and nutritional needs.",
        size: "1.5 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/BMI_chart.png/640px-BMI_chart.png"
    },
    {
        title: "Fatigue Fighters",
        desc: "Gentle exercises and energy conservation techniques to keep you moving.",
        size: "2.2 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Woman_jogging.jpg/640px-Woman_jogging.jpg"
    },
    {
        title: "Mental Resilience",
        desc: "Mindfulness and coping strategies for the emotional journey of cancer treatment.",
        size: "2.9 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Woman_meditating_on_beach.jpg/640px-Woman_meditating_on_beach.jpg"
    },
    {
        title: "Cervical Cancer 101",
        desc: "An educational overview of cervical cancer stages, treatments, and terminology.",
        size: "4.5 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Cervical_Cancer_Awareness_Ribbon.png/640px-Cervical_Cancer_Awareness_Ribbon.png"
    },
    {
        title: "Caregiver's Handbook",
        desc: "How friends and family can provide effective physical and emotional support.",
        size: "2.0 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Holding_hands.jpg/640px-Holding_hands.jpg"
    },
    {
        title: "Post-Treatment Life",
        desc: "Navigating the 'new normal': diet, exercise, and follow-up care after treatment.",
        size: "3.5 MB",
        img: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Healthy_lifestyle.jpg/640px-Healthy_lifestyle.jpg"
    }
  ];

  return (
    <div className="p-6 animate-fade-in pb-24">
      <h1 className="text-3xl font-bold mb-2 text-emerald-900 dark:text-white">Library</h1>
      <p className="text-gray-600 mb-6 dark:text-gray-400">Download offline resources for your journey.</p>
      
      <div className="grid grid-cols-1 gap-4">
        {documents.map((doc, index) => (
          <div key={index} className="flex bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md border border-emerald-50 dark:border-slate-700 overflow-hidden transition-all hover:scale-[1.02] active:scale-95">
             <img src={doc.img} alt={doc.title} className="w-20 h-24 object-cover rounded-xl flex-shrink-0 bg-gray-200" />
             <div className="ml-4 flex flex-col justify-between flex-grow">
                <div>
                    <h3 className="font-bold text-emerald-900 dark:text-white text-lg leading-tight mb-1">{doc.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{doc.desc}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md dark:bg-emerald-900/30 dark:text-emerald-400">{doc.size}</span>
                    <button className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DoctorConnectScreen: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
    if (userProfile.plan === 'Premium') {
        // Premium View
        return (
            <div className="p-6 h-full flex flex-col justify-center animate-fade-in">
                <h1 className="text-3xl font-bold mb-8 text-emerald-900 dark:text-white text-center">Doctor Connect</h1>
                <div className="space-y-5 animate-stagger-children">
                    <button className="btn-tertiary w-full flex items-center p-5 h-auto !justify-start">
                        <div className="bg-white/50 p-3 rounded-full mr-4">
                            <ChatBubbleIcon className="w-6 h-6 text-emerald-900" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-white text-left">Chat</p>
                            <p className="text-xs text-white text-left opacity-80">Message your nutritionist</p>
                        </div>
                    </button>
                    <button className="btn-secondary w-full flex items-center p-5 h-auto !justify-start">
                         <div className="bg-white/30 p-3 rounded-full mr-4">
                            <VideoCallIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                             <p className="font-bold text-lg text-white text-left">Video Call</p>
                             <p className="text-xs text-white text-left opacity-90">Schedule a live session</p>
                        </div>
                    </button>
                    <button className="btn-primary w-full flex items-center p-5 h-auto !justify-start">
                        <div className="bg-white/20 p-3 rounded-full mr-4">
                            <ShareIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-white text-left">Share Progress</p>
                            <p className="text-xs text-white text-left opacity-90">Send logs and reports</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // Free View (Teaser)
    return (
        <div className="p-6 text-center flex flex-col items-center justify-center h-full animate-fade-in">
            <h1 className="text-3xl font-bold mb-6 text-emerald-900 dark:text-white">Doctor Connect</h1>
            <div className="border border-emerald-200 p-8 rounded-2xl dark:border-emerald-800 w-full bg-white/50 shadow-lg">
                <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <PremiumIcon className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Need Expert Guidance?</h2>
                <p className="text-gray-600 mb-8 dark:text-gray-400 text-sm">Upgrade to Premium to chat directly with certified nutritionists and oncologists.</p>
                <button className="btn-primary shadow-glow-primary">Upgrade to Premium</button>
            </div>
        </div>
    );
};


const ProfileScreen: React.FC<{ userProfile: UserProfile, onLogout: () => void }> = ({ userProfile, onLogout }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    
    const menuItems = [
      { label: "Edit Profile", action: () => {} },
      { label: "Theme", action: toggleTheme, isToggle: true },
      { label: "Switch Plan", action: () => {} },
      { label: "Privacy Settings", action: () => {} },
      { label: "Help Center", action: () => {} },
    ];

    const calculateBMI = () => {
        if (userProfile.height && userProfile.weight) {
            const heightInMeters = userProfile.height / 100;
            const bmi = (userProfile.weight / (heightInMeters * heightInMeters)).toFixed(1);
            return bmi;
        }
        return 'N/A';
    };
    
    const getBMILabel = (bmiStr: string) => {
        const bmi = parseFloat(bmiStr);
        if (isNaN(bmi)) return '';
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Healthy';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    };

    const bmi = calculateBMI();
    const bmiLabel = getBMILabel(bmi);
    
    return (
        <div className="p-6 animate-fade-in">
            <div className="flex flex-col items-center mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="relative">
                    <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg mb-4">
                         <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <UserIcon className="w-14 h-14 text-emerald-600" />
                         </div>
                    </div>
                </div>
                <h2 className="text-2xl font-bold dark:text-white text-emerald-900">{userProfile.name}</h2>
                <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm mb-4">{userProfile.email || 'guest@nutrican.app'}</p>
                
                {/* Health Stats Card */}
                <div className="w-full grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-emerald-50 dark:border-slate-700 text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Height</p>
                        <p className="text-lg font-bold text-emerald-900 dark:text-white">{userProfile.height || '-'} <span className="text-xs font-normal">cm</span></p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-emerald-50 dark:border-slate-700 text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Weight</p>
                        <p className="text-lg font-bold text-emerald-900 dark:text-white">{userProfile.weight || '-'} <span className="text-xs font-normal">kg</span></p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-emerald-50 dark:border-slate-700 text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">BMI</p>
                        <p className="text-lg font-bold text-emerald-900 dark:text-white">{bmi}</p>
                    </div>
                </div>
                {bmiLabel && <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">{bmiLabel}</span>}
            </div>

            <div className="space-y-3 animate-stagger-children">
                {menuItems.map((item, index) => (
                    <button 
                        key={item.label}
                        onClick={item.action} 
                        className="btn-tertiary w-full !justify-between !px-6 group"
                        style={{ animationDelay: `${200 + index * 100}ms` }}
                    >
                        <span className="text-white group-hover:text-emerald-100">{item.label}</span>
                        {item.isToggle ? (
                            <span className="bg-white/50 text-emerald-900 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                                {theme === 'dark' ? 'Dark' : 'Light'}
                            </span>
                        ) : (
                            <span className="text-white group-hover:text-emerald-100">&rarr;</span>
                        )}
                    </button>
                ))}
                <button 
                  onClick={onLogout} 
                  className="btn-primary w-full mt-6 !bg-gradient-to-b !from-slate-700 !to-slate-800 !border-slate-600"
                  style={{ animationDelay: `${200 + menuItems.length * 100}ms`, boxShadow: '0 4px 0 #334155, 0 8px 10px rgba(0,0,0,0.2)' }}
                >
                  Log Out
                </button>
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

  const pages = useMemo(() => ({
    home: <HomeScreen userProfile={userProfile} setActivePage={setActivePage} setModal={setModalContent} />,
    tracker: <ProgressJournalScreen userProfile={userProfile} />,
    library: <LibraryScreen />,
    'doctor-connect': <DoctorConnectScreen userProfile={userProfile} />,
    profile: <ProfileScreen userProfile={userProfile} onLogout={onLogout} />,
  }), [userProfile, onLogout]);

  const CurrentPage = pages[activePage] || pages.home;

  return (
    <div className="pb-24 relative min-h-screen bg-transparent">
      <div className="pt-4">{CurrentPage}</div>
      <EmergencyButton activePage={activePage} />
      <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
      {modalContent && <Modal closeModal={() => setModalContent(null)}>{modalContent}</Modal>}
    </div>
  );
};

export default Dashboard;