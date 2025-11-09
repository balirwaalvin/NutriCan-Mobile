import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { UserProfile, DashboardPage, WeeklyMealPlan, FoodSafetyStatus, FoodSafetyResult, Meal, NutrientInfo, SymptomType, RecommendedFood, JournalEntry } from '../types';
import { HomeIcon, ChartIcon, BookIcon, PremiumIcon, UserIcon, SearchIcon, LogoIcon, ProteinIcon, CarbsIcon, BalancedIcon, BowlIcon, PlusIcon, NauseaIcon, FatigueIcon, MouthSoreIcon, BellIcon, ChatBubbleIcon, VideoCallIcon, ShareIcon } from './Icons';
import { checkFoodSafety, generateMealPlan, swapMeal, getNutrientInfo, getSymptomTips } from '../services/geminiService';
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
    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white/70 backdrop-blur-xl border-t border-gray-200 flex justify-around p-2 dark:bg-slate-900/70 dark:border-slate-700">
      {navItems.map(item => {
          const isActive = activePage === item.page;
          return (
            <button key={item.page} onClick={() => onNavigate(item.page)} className="flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all transform hover:scale-110">
              <div className="relative">
                <item.icon className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-brand-orange' : 'text-gray-400 dark:text-slate-500'}`} style={{filter: isActive ? 'drop-shadow(0 0 5px #F97316)' : 'none'}} />
              </div>
              <span className={`text-xs transition-colors ${isActive ? 'text-brand-orange font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{item.label}</span>
            </button>
          )
      })}
    </div>
  );
};

const EmergencyButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)} className="fixed bottom-24 right-4 bg-red-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-red-500/50 text-lg font-bold z-50 animate-pulse transition-transform hover:scale-110">
        SOS
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl text-center dark:bg-slate-800 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Emergency Contact</h2>
            <button className="w-full bg-red-500 text-white py-2 rounded-lg mb-2">Call Hospital</button>
            <button className="w-full bg-blue-500 text-white py-2 rounded-lg">Call Caregiver</button>
            <button onClick={() => setShowModal(false)} className="mt-4 text-gray-600 dark:text-gray-400">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};


// --- Feature Screens ---

const HomeScreen: React.FC<{ userProfile: UserProfile, setActivePage: (page: DashboardPage) => void, setModal: (content: React.ReactNode) => void }> = ({ userProfile, setModal }) => {
    const features = [
        { name: 'Personalized Meal Plan', action: () => setModal(<MealPlanScreen userProfile={userProfile} />) },
        { name: 'Food Safety Checker', action: () => setModal(<FoodSafetyCheckerScreen userProfile={userProfile} />) },
        { name: 'Nutrient Tracker', action: () => setModal(<NutrientTrackerScreen />) },
        { name: 'Symptom-Based Tips', action: () => setModal(<SymptomTipsScreen />) },
        { name: 'Progress Journal', action: () => setModal(<ProgressJournalScreen />) },
        { name: 'Reminders & Alerts', action: () => setModal(<RemindersScreen />) },
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
            <div className="bg-gradient-header-light p-4 rounded-xl mb-6 dark:bg-gradient-header-dark shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hello, {userProfile.name}!</h1>
                <p className="text-gray-600 dark:text-gray-300">Here's today's plan.</p>
            </div>
            <div className="relative rounded-xl mb-6 w-full h-40 overflow-hidden shadow-lg">
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
                 <div className="absolute inset-0 bg-black/30"></div>
                 <div className="absolute bottom-3 left-4 text-white font-bold text-lg drop-shadow-lg">Stay strong, eat well.</div>
            </div>
            <div className="grid grid-cols-2 gap-4 animate-stagger-children">
                {features.map((feature, index) => (
                    <button key={feature.name} onClick={feature.action} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition text-center dark:bg-slate-800/80 hover:-translate-y-1 duration-300 dark:hover:shadow-orange-700/30 dark:border dark:border-slate-700" style={{ animationDelay: `${index * 100}ms` }}>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{feature.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const Modal: React.FC<{ children: React.ReactNode; closeModal: () => void }> = ({ children, closeModal }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center animate-fade-in" onClick={closeModal}>
        <div className="bg-white max-w-sm w-full h-full overflow-y-auto dark:bg-slate-900 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-3xl font-bold text-gray-600 dark:text-gray-400 z-10">&times;</button>
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden dark:bg-slate-800 animate-fade-in-up border-b-4 border-brand-orange" style={{ animationDelay: `${delay}ms` }}>
            <div className="relative">
                <img src={meal.photoUrl} alt={meal.name} className="w-full h-32 object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {isSwapping && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><LogoIcon className="animate-spin h-8 w-8 text-white" /></div>}
                <p className="absolute bottom-2 left-4 font-bold text-lg text-white drop-shadow-md">{meal.name}</p>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-full px-3 py-1 text-sm text-brand-orange">
                        {categoryIcon}
                        <span className="dark:text-gray-300">{meal.category}</span>
                    </div>
                </div>
                <p className="text-gray-600 text-sm mt-1 dark:text-gray-400">{meal.description}</p>
                <button onClick={onSwap} disabled={isSwapping} className="text-sm bg-gray-200 px-3 py-1 rounded-full mt-3 hover:bg-gray-300 disabled:opacity-50 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">
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

  if (loading) return <div className="p-4 text-center dark:text-gray-300">Generating your personalized meal plan... <LogoIcon className="animate-spin h-8 w-8 mx-auto mt-4 text-brand-orange" /></div>;
  if (!mealPlan) return <div className="p-4 text-center dark:text-gray-300">Could not generate a meal plan. Please try again later.</div>;

  const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const selectedDayData = mealPlan[selectedDayIndex];

  return (
    <div className="p-6 bg-transparent min-h-full">
      <h2 className="text-3xl font-bold mb-4 dark:text-white animate-fade-in text-transparent bg-clip-text bg-gradient-primary">Weekly Meal Plan</h2>
      
      <div className="flex justify-around mb-4 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
        {dayShortNames.map((day, index) => (
          <button 
            key={day}
            onClick={() => setSelectedDayIndex(index)}
            className={`px-3 py-2 rounded-lg font-semibold text-sm w-full transition-all duration-300 ${selectedDayIndex === index ? 'bg-gradient-primary text-white shadow-md' : 'text-gray-700 dark:text-gray-300'}`}
          >
            {day}
          </button>
        ))}
      </div>

      <div key={selectedDayIndex} className="animate-fade-in">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">{selectedDayData.day}</h3>
        <div className="space-y-4">
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
            base: 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-600',
            shadow: 'shadow-glow-emerald',
        },
        [FoodSafetyStatus.LIMIT]: {
            base: 'bg-yellow-50 text-yellow-800 border-yellow-400 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-600',
            shadow: 'shadow-glow-yellow',
        },
        [FoodSafetyStatus.AVOID]: {
            base: 'bg-red-50 text-red-800 border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-600',
            shadow: 'shadow-glow-red',
        },
    };

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-primary">Food Safety Checker</h2>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input 
                    type="text"
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    placeholder="e.g., Avocado"
                    className="flex-grow p-3 border rounded-lg bg-transparent border-slate-300 dark:border-slate-700 dark:text-white focus:ring-brand-orange focus:border-brand-orange focus:shadow-glow-primary transition-shadow"
                />
                <button type="submit" className="bg-gradient-primary text-white p-3 rounded-lg hover:shadow-glow-primary transition-shadow">
                    <SearchIcon className="w-6 h-6"/>
                </button>
            </form>

            {loading && <div className="text-center p-8"><LogoIcon className="animate-spin h-8 w-8 mx-auto text-brand-orange" /></div>}
            {result && (
                <div className={`p-4 rounded-lg border-2 shadow-lg ${statusStyles[result.status].base} ${statusStyles[result.status].shadow} animate-fade-in`}>
                    <div className="flex items-center">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_and_magnifying_glass.jpg/1024px-Apple_and_magnifying_glass.jpg" alt={food} className="w-16 h-16 rounded-lg mr-4 object-cover"/>
                        <div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[result.status].base}`}>{result.status}</span>
                            <p className="font-semibold text-lg mt-1 dark:text-gray-100">{food}</p>
                        </div>
                    </div>
                    <p className="mt-2 text-sm">{result.reason}</p>
                </div>
            )}
        </div>
    );
};

const NutrientTrackerScreen: React.FC = () => {
    const [nutrients, setNutrients] = useState<NutrientInfo>({ calories: 0, sugar: 0, salt: 0 });
    const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
    const [mealName, setMealName] = useState('');
    const [isAddingMeal, setIsAddingMeal] = useState(false);

    const nutrientData = [
        { name: 'Calories', value: nutrients.calories, goal: 2000, unit: 'kcal', color: '#F97316' },
        { name: 'Sugar', value: nutrients.sugar, goal: 50, unit: 'g', color: '#F43F5E' },
        { name: 'Salt', value: nutrients.salt, goal: 2.3, unit: 'g', color: '#3B82F6' },
    ];
    
    const handleAddMeal = async () => {
        if (!mealName.trim()) return;
        setIsAddingMeal(true);
        const result = await getNutrientInfo(mealName);
        if (result) {
            setNutrients(prev => ({
                calories: prev.calories + result.calories,
                sugar: prev.sugar + result.sugar,
                salt: prev.salt + result.salt,
            }));
            setMealName('');
            setIsAddMealModalOpen(false);
        } else {
            alert("Could not get nutrient information for this meal. Please try again.");
        }
        setIsAddingMeal(false);
    };

    const isOverAnyLimit = nutrientData.some(item => item.value > item.goal);

    return (
        <div className="p-6 animate-fade-in relative min-h-full">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-primary">Nutrient Tracker</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
                {nutrientData.map(item => {
                    const percentage = Math.min((item.value / item.goal) * 100, 100);
                    const isOver = item.value > item.goal;
                    return (
                        <div key={item.name}>
                             <ResponsiveContainer width="100%" height={100}>
                                <PieChart>
                                    <Pie data={[{ value: percentage }, { value: 100 - percentage }]} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={40} startAngle={90} endAngle={-270} paddingAngle={0} cornerRadius={20} isAnimationActive={true}>
                                        <Cell fill={isOver ? '#EF4444' : item.color} />
                                        <Cell fill="#475569" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <p className="font-semibold dark:text-gray-200">{item.name}</p>
                            <p className={`text-sm ${isOver ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                {item.value.toFixed(1)} / {item.goal} {item.unit}
                            </p>
                        </div>
                    )
                })}
            </div>
            
            <div className={`mt-6 p-4 rounded-lg text-center font-semibold flex items-center justify-center gap-2 ${isOverAnyLimit 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' 
                : 'bg-emerald-100 text-brand-emerald dark:bg-brand-emerald/20'}`
            }>
                {!isOverAnyLimit && <img src="https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2Fsmiling-apple.png?alt=media&token=e9d05f31-5a0a-42d3-832f-5cb0f56a591e" alt="Smiling Apple" className="w-8 h-8"/>}
                <p>
                    {isOverAnyLimit 
                        ? "You've exceeded some limits. Let's aim for balance tomorrow!" 
                        : "Great job staying on track today!"}
                </p>
            </div>
            
            <button 
                onClick={() => setIsAddMealModalOpen(true)}
                className="absolute bottom-6 right-6 bg-gradient-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-glow-primary transition-all transform hover:scale-110 animate-pulse-glow"
                aria-label="Add Meal"
            >
                <PlusIcon className="w-8 h-8"/>
            </button>

            {isAddMealModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsAddMealModalOpen(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl text-center w-full max-w-xs dark:bg-slate-800 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Add a Meal</h2>
                        <input
                            type="text"
                            value={mealName}
                            onChange={(e) => setMealName(e.target.value)}
                            placeholder="e.g., A plate of matoke"
                            className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-4 focus:ring-brand-orange focus:border-brand-orange"
                        />
                        <button 
                            onClick={handleAddMeal} 
                            disabled={isAddingMeal}
                            className="w-full bg-gradient-primary text-white py-2 rounded-lg disabled:bg-gray-400"
                        >
                            {isAddingMeal ? 'Analyzing...' : 'Add Meal'}
                        </button>
                        <button onClick={() => setIsAddMealModalOpen(false)} className="mt-2 text-gray-600 dark:text-gray-400 text-sm">Cancel</button>
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
        [SymptomType.NAUSEA]: { icon: NauseaIcon, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
        [SymptomType.FATIGUE]: { icon: FatigueIcon, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
        [SymptomType.MOUTH_SORES]: { icon: MouthSoreIcon, color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/50' },
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
                <button onClick={() => setViewingSymptom(null)} className="mb-4 text-brand-orange font-semibold flex items-center gap-1">&larr; Back to Symptoms</button>
                <h2 className="text-2xl font-bold mb-4 dark:text-white">Tips for {viewingSymptom}</h2>
                {loading && <div className="text-center p-8"><LogoIcon className="animate-spin h-8 w-8 mx-auto text-brand-orange" /></div>}
                
                {currentTips && (
                    <div className="space-y-3 animate-fade-in-up">
                        {currentTips.map((food, index) => (
                            <div key={index} className="flex items-start bg-white p-3 rounded-lg shadow-sm dark:bg-slate-800">
                                <img src={food.photoUrl} alt={food.name} className="w-16 h-16 rounded-md object-cover mr-4" />
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{food.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{food.description}</p>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={handleSaveTips}
                            disabled={isCurrentTipSaved}
                            className="w-full font-bold py-3 rounded-xl mt-4 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed bg-gradient-primary text-white hover:shadow-glow-primary"
                        >
                            {isCurrentTipSaved ? 'Saved' : 'Save for Later'}
                        </button>
                    </div>
                )}
                
                {!loading && !currentTips && <p className="text-center text-red-500 p-8">Could not load tips. Please try again.</p>}
            </div>
        );
    }

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-primary">Symptom-Based Tips</h2>
            <p className="text-gray-500 mb-6 dark:text-gray-400">Get food recommendations to help manage common symptoms.</p>
            <div className="space-y-4">
                {Object.values(SymptomType).map(symptom => {
                    const config = symptomConfig[symptom];
                    return (
                        <button 
                            key={symptom} 
                            onClick={() => handleViewSymptom(symptom)}
                            className={`flex items-center w-full text-left p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${config.bg}`}
                        >
                            <config.icon className={`w-8 h-8 mr-4 ${config.color}`} />
                            <span className={`font-semibold flex-grow ${config.color}`}>{symptom}</span>
                            <span className={config.color}>&rarr;</span>
                        </button>
                    )
                })}
            </div>

            {Object.keys(savedTips).length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-3 dark:text-white">Your Saved Tips</h3>
                    <div className="space-y-2">
                        {Object.keys(savedTips).map(symptom => (
                            <button 
                                key={symptom} 
                                onClick={() => handleViewSymptom(symptom as SymptomType)}
                                className="w-full text-left bg-gray-100 p-3 rounded-lg dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600"
                            >
                                View saved tips for {symptom}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProgressJournalScreen: React.FC = () => {
    const initialJournalData: JournalEntry[] = [
        { name: 'Mon', weight: 70, energy: 7, bp: 120 },
        { name: 'Tue', weight: 70.2, energy: 6, bp: 122 },
        { name: 'Wed', weight: 70.1, energy: 8, bp: 118 },
        { name: 'Thu', weight: 69.9, energy: 7, bp: 121 },
        { name: 'Fri', weight: 69.8, energy: 9, bp: 119 },
    ];

    const [journalData, setJournalData] = useState<JournalEntry[]>(initialJournalData);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEntry, setNewEntry] = useState({ weight: '', bp: '', energy: '' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleAddEntry = (e: React.FormEvent) => {
        e.preventDefault();
        const weight = parseFloat(newEntry.weight);
        const bp = parseInt(newEntry.bp, 10);
        const energy = parseInt(newEntry.energy, 10);

        if (isNaN(weight) || isNaN(bp) || isNaN(energy) || energy < 1 || energy > 10) {
            alert("Please enter valid numbers for all fields. Energy must be between 1 and 10.");
            return;
        }

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const lastEntryName = journalData.length > 0 ? journalData[journalData.length - 1].name : 'Sun';
        const lastDayIndex = dayNames.indexOf(lastEntryName);
        const nextDayName = dayNames[(lastDayIndex + 1) % 7];

        const entry: JournalEntry = {
            name: nextDayName,
            weight,
            bp,
            energy
        };

        setJournalData(prevData => [...prevData, entry].slice(-7));
        setNewEntry({ weight: '', bp: '', energy: '' });
        setIsModalOpen(false);
    };

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-primary">Progress Journal</h2>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={journalData}>
                    <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#F97316" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="weight" stroke="#F97316" fill="url(#colorWeight)" name="Weight (kg)" isAnimationActive={true}/>
                    <Area yAxisId="right" type="monotone" dataKey="energy" stroke="#10B981" fill="url(#colorEnergy)" name="Energy (1-10)" isAnimationActive={true}/>
                </AreaChart>
            </ResponsiveContainer>
             <div className="mt-6 p-4 bg-emerald-100 rounded-lg text-center text-emerald-800 font-semibold dark:bg-emerald-900/50 dark:text-emerald-300">
                <p>You're improving! Keep going!</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-4">Add New Entry</button>
        
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xs dark:bg-slate-800 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 dark:text-white text-center">Add New Entry</h2>
                        <form onSubmit={handleAddEntry} className="space-y-4">
                            <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">Weight (kg)</label>
                                <input
                                    type="number"
                                    id="weight"
                                    name="weight"
                                    value={newEntry.weight}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg mt-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-orange focus:border-brand-orange"
                                    required
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label htmlFor="bp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">Blood Pressure (Systolic)</label>
                                <input
                                    type="number"
                                    id="bp"
                                    name="bp"
                                    value={newEntry.bp}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg mt-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-orange focus:border-brand-orange"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="energy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">Energy Level (1-10)</label>
                                <input
                                    type="number"
                                    id="energy"
                                    name="energy"
                                    value={newEntry.energy}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg mt-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-brand-orange focus:border-brand-orange"
                                    required
                                    min="1"
                                    max="10"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-300 transition dark:bg-slate-600 dark:text-gray-200">
                                    Cancel
                                </button>
                                <button type="submit" className="w-full bg-gradient-primary text-white font-bold py-2 rounded-xl hover:shadow-glow-primary transition">
                                    Save Entry
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
          <div className={`w-11 h-6 bg-gray-300 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isEnabled ? color : ''}`}></div>
        </label>
    );
};

const ReminderCard: React.FC<{
    title: string;
    description: string;
    isEnabled: boolean;
    onToggle: () => void;
    colorClasses: string;
    toggleColor: string;
}> = ({ title, description, isEnabled, onToggle, colorClasses, toggleColor }) => (
    <div className={`p-4 rounded-xl flex items-center justify-between shadow-sm ${colorClasses}`}>
        <div className="flex items-center">
            <BellIcon className="w-8 h-8 mr-4" />
            <div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-sm opacity-80">{description}</p>
            </div>
        </div>
        <ToggleSwitch isEnabled={isEnabled} onToggle={onToggle} color={toggleColor} />
    </div>
);

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
            title: "Set Meal Reminders",
            description: "Reminders are set for every 3 hours.",
            colorClasses: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
            toggleColor: "bg-brand-orange",
        },
        {
            key: 'water' as const,
            title: "Set Water Reminders",
            description: "Stay hydrated throughout the day.",
            colorClasses: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
            toggleColor: "bg-sky-500",
        },
        {
            key: 'medication' as const,
            title: "Set Medication Reminders",
            description: "Never miss a dose.",
            colorClasses: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
            toggleColor: "bg-brand-emerald",
        },
    ];

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-primary">Reminders & Alerts</h2>
            <div className="space-y-4">
                {reminderConfig.map(config => (
                    <ReminderCard
                        key={config.key}
                        title={config.title}
                        description={config.description}
                        isEnabled={reminders[config.key]}
                        onToggle={() => handleToggle(config.key)}
                        colorClasses={config.colorClasses}
                        toggleColor={config.toggleColor}
                    />
                ))}
            </div>
        </div>
    );
};

const LibraryScreen: React.FC = () => {
  const articles = [
    { title: "Healthy Recipes for Chemo", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Vegetable_Stir-Fry.jpg/1280px-Vegetable_Stir-Fry.jpg" },
    { title: "Managing Side Effects", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Tea_in_glass_cup.jpg/1024px-Tea_in_glass_cup.jpg" },
    { title: "The Power of Hydration", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/A_glass_of_water.jpg/800px-A_glass_of_water.jpg" },
  ];
  return (
    <div className="p-4 animate-fade-in">
      <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-primary">Offline Library</h1>
      <div className="space-y-4 animate-stagger-children">
        {articles.map((article, index) => (
          <div key={article.title} className="flex items-center bg-white p-3 rounded-lg shadow-sm dark:bg-slate-800 transition-transform hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
            <img src={article.img} alt={article.title} className="w-24 h-16 rounded-md object-cover mr-4" />
            <span className="font-semibold text-gray-700 flex-grow dark:text-gray-300">{article.title}</span>
            <button className="text-gray-400 dark:text-gray-500">&#x2B07;</button>
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
                <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-primary text-center">Doctor Connect</h1>
                <div className="space-y-4 animate-stagger-children">
                    <button className="w-full bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center dark:bg-slate-800/80 hover:-translate-y-1 duration-300 dark:hover:shadow-orange-700/30">
                        <ChatBubbleIcon className="w-8 h-8 text-brand-orange mr-4" />
                        <div>
                            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100 text-left">Chat</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-left">Message your nutritionist</p>
                        </div>
                    </button>
                    <button className="w-full bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center dark:bg-slate-800/80 hover:-translate-y-1 duration-300 dark:hover:shadow-orange-700/30">
                        <VideoCallIcon className="w-8 h-8 text-brand-orange mr-4" />
                        <div>
                             <p className="font-semibold text-lg text-gray-800 dark:text-gray-100 text-left">Video Call</p>
                             <p className="text-sm text-gray-500 dark:text-gray-400 text-left">Schedule a live session</p>
                        </div>
                    </button>
                    <button className="w-full bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center dark:bg-slate-800/80 hover:-translate-y-1 duration-300 dark:hover:shadow-orange-700/30">
                        <ShareIcon className="w-8 h-8 text-brand-orange mr-4" />
                        <div>
                            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100 text-left">Share Progress</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-left">Send logs and reports</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    // Free View (Teaser)
    return (
        <div className="p-6 text-center flex flex-col items-center justify-center h-full animate-fade-in">
            <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-primary">Doctor Connect</h1>
            <div className="border-2 border-brand-orange border-dashed p-8 rounded-xl dark:border-brand-orange/50 w-full">
                <PremiumIcon className="w-16 h-16 text-brand-orange mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Need extra guidance?</h2>
                <p className="text-gray-600 mt-2 dark:text-gray-400">Upgrade to chat with a certified nutritionist.</p>
                <button className="btn-primary mt-6">Upgrade Now</button>
            </div>
        </div>
    );
};


const ProfileScreen: React.FC<{ userProfile: UserProfile, onLogout: () => void }> = ({ userProfile, onLogout }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    
    const menuItems = [
      { label: "Edit Profile", action: () => {} },
      { label: "Theme", action: toggleTheme, isToggle: true },
      { label: "Switch Plan (Free/Premium)", action: () => {} },
      { label: "Privacy Settings", action: () => {} },
      { label: "Help Center", action: () => {} },
    ];
    
    return (
        <div className="p-6 animate-fade-in">
            <div className="flex flex-col items-center mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <UserIcon className="w-24 h-24 text-gray-400 bg-gray-200 rounded-full p-4 mb-4 dark:bg-slate-700 dark:text-gray-400" />
                <h2 className="text-2xl font-bold dark:text-white">{userProfile.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{userProfile.email || 'guest@nutrican.app'}</p>
            </div>
            <div className="space-y-3 animate-stagger-children">
                {menuItems.map((item, index) => (
                    <button 
                        key={item.label}
                        onClick={item.action} 
                        className="w-full text-left bg-gray-100 p-3 rounded-lg flex justify-between items-center dark:bg-slate-800 dark:text-gray-200 transition-transform hover:bg-gray-200 dark:hover:bg-slate-700 hover:scale-105"
                        style={{ animationDelay: `${200 + index * 100}ms` }}
                    >
                        <span>{item.label}</span>
                        {item.isToggle && (
                            <span className="capitalize bg-gray-200 dark:bg-slate-600 px-2 py-1 rounded-md text-sm">
                                {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                            </span>
                        )}
                    </button>
                ))}
                <button 
                  onClick={onLogout} 
                  className="w-full text-left bg-red-100 text-red-600 p-3 rounded-lg font-semibold dark:bg-red-900/50 dark:text-red-400 transition-transform hover:scale-105"
                  style={{ animationDelay: `${200 + menuItems.length * 100}ms` }}
                >
                  Logout
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
    tracker: <ProgressJournalScreen />, // Changed to show the graph page
    library: <LibraryScreen />,
    'doctor-connect': <DoctorConnectScreen userProfile={userProfile} />,
    profile: <ProfileScreen userProfile={userProfile} onLogout={onLogout} />,
  }), [userProfile, onLogout]);

  const CurrentPage = pages[activePage] || pages.home;

  return (
    <div className="pb-24 relative min-h-screen bg-transparent">
      <div className="pt-4">{CurrentPage}</div>
      <EmergencyButton />
      <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
      {modalContent && <Modal closeModal={() => setModalContent(null)}>{modalContent}</Modal>}
    </div>
  );
};

export default Dashboard;