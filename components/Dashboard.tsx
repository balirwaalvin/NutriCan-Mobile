import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { UserProfile, DashboardPage, MealPlan, FoodSafetyStatus, FoodSafetyResult } from '../types';
import { HomeIcon, ChartIcon, BookIcon, PremiumIcon, UserIcon, SearchIcon, LogoIcon } from './Icons';
import { checkFoodSafety, generateMealPlan } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ThemeContext } from '../contexts/ThemeContext';

// --- Reusable UI Components ---

const BottomNavBar: React.FC<{ activePage: DashboardPage; onNavigate: (page: DashboardPage) => void }> = ({ activePage, onNavigate }) => {
  const navItems = [
    { page: 'home' as DashboardPage, icon: HomeIcon, label: 'Home' },
    { page: 'tracker' as DashboardPage, icon: ChartIcon, label: 'Tracker' },
    { page: 'library' as DashboardPage, icon: BookIcon, label: 'Library' },
    { page: 'premium' as DashboardPage, icon: PremiumIcon, label: 'Premium' },
    { page: 'profile' as DashboardPage, icon: UserIcon, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white border-t border-gray-200 flex justify-around p-2 dark:bg-gray-800 dark:border-gray-700">
      {navItems.map(item => (
        <button key={item.page} onClick={() => onNavigate(item.page)} className="flex flex-col items-center justify-center w-16 h-16">
          <item.icon className={`w-6 h-6 mb-1 ${activePage === item.page ? 'text-brand-purple' : 'text-gray-400'}`} />
          <span className={`text-xs ${activePage === item.page ? 'text-brand-purple font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const EmergencyButton: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)} className="fixed bottom-20 right-4 bg-red-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg text-lg font-bold z-50">
        SOS
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl text-center dark:bg-gray-800 animate-fade-in-up" onClick={e => e.stopPropagation()}>
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
    return (
        <div className="p-4 animate-fade-in">
            <div className="bg-soft-lavender p-4 rounded-xl mb-6 dark:bg-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Hello, {userProfile.name}!</h1>
                <p className="text-gray-600 dark:text-gray-300">Here's today's plan.</p>
            </div>
            <img src="https://picsum.photos/seed/vegetables/400/200" alt="Fresh vegetables" className="rounded-xl mb-6 w-full h-32 object-cover"/>
            <div className="grid grid-cols-2 gap-4 animate-stagger-children">
                {features.map((feature, index) => (
                    <button key={feature.name} onClick={feature.action} className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition text-center dark:bg-gray-700 dark:hover:shadow-purple-800/50" style={{ animationDelay: `${index * 100}ms` }}>
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{feature.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const Modal: React.FC<{ children: React.ReactNode; closeModal: () => void }> = ({ children, closeModal }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center animate-fade-in" onClick={closeModal}>
        <div className="bg-white max-w-sm w-full h-full overflow-y-auto dark:bg-gray-900 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-2xl font-bold text-gray-600 dark:text-gray-400 z-10">&times;</button>
            {children}
        </div>
    </div>
);


const MealPlanScreen: React.FC<{ userProfile: UserProfile }> = ({ userProfile }) => {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMealPlan = useCallback(async () => {
    setLoading(true);
    const plan = await generateMealPlan(userProfile);
    setMealPlan(plan);
    setLoading(false);
  }, [userProfile]);
  
  useEffect(() => {
    fetchMealPlan();
  }, [fetchMealPlan]);

  if (loading) return <div className="p-4 text-center dark:text-gray-300">Generating your personalized meal plan... <LogoIcon className="animate-spin h-8 w-8 mx-auto mt-4 text-brand-purple" /></div>;
  if (!mealPlan) return <div className="p-4 text-center dark:text-gray-300">Could not generate a meal plan. Please try again later.</div>;

  const MealCard: React.FC<{ meal: any, title: string, delay: number }> = ({ meal, title, delay }) => (
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4 dark:bg-gray-800 animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
          <img src={meal.photoUrl} alt={meal.name} className="w-full h-32 object-cover"/>
          <div className="p-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
              <p className="font-semibold text-brand-purple">{meal.name}</p>
              <p className="text-gray-600 text-sm mt-1 dark:text-gray-400">{meal.description}</p>
              <button onClick={fetchMealPlan} className="text-sm bg-gray-200 px-3 py-1 rounded-full mt-3 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Swap Meal</button>
          </div>
      </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-full dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-4 dark:text-white animate-fade-in">Today's Meal Plan</h2>
      <MealCard meal={mealPlan.breakfast} title="Breakfast" delay={100} />
      <MealCard meal={mealPlan.lunch} title="Lunch" delay={200} />
      <MealCard meal={mealPlan.dinner} title="Dinner" delay={300} />
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

    const statusColors = {
        [FoodSafetyStatus.SAFE]: 'bg-green-100 text-green-800 border-green-400 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600',
        [FoodSafetyStatus.LIMIT]: 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-600',
        [FoodSafetyStatus.AVOID]: 'bg-red-100 text-red-800 border-red-400 dark:bg-red-900/50 dark:text-red-300 dark:border-red-600',
    };

    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Food Safety Checker</h2>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input 
                    type="text"
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    placeholder="e.g., Avocado"
                    className="flex-grow p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button type="submit" className="bg-brand-purple text-white p-3 rounded-lg">
                    <SearchIcon className="w-6 h-6"/>
                </button>
            </form>

            {loading && <p className="dark:text-gray-300">Checking...</p>}
            {result && (
                <div className={`p-4 rounded-lg border-2 ${statusColors[result.status]} animate-fade-in`}>
                    <div className="flex items-center">
                        <img src={`https://picsum.photos/seed/${food}/100/100`} alt={food} className="w-16 h-16 rounded-lg mr-4 object-cover"/>
                        <div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[result.status]}`}>{result.status}</span>
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
    const data = [
        { name: 'Calories', value: 1200, goal: 2000, color: '#8B5CF6' },
        { name: 'Sugar', value: 45, goal: 50, color: '#EC4899' },
        { name: 'Salt', value: 1.8, goal: 2.3, color: '#3B82F6' },
    ];
    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Nutrient Tracker</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
                {data.map(item => {
                    const percentage = Math.min((item.value / item.goal) * 100, 100);
                    const isOver = item.value > item.goal;
                    return (
                        <div key={item.name}>
                             <ResponsiveContainer width="100%" height={100}>
                                <PieChart>
                                    <Pie data={[{ value: percentage }, { value: 100 - percentage }]} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={40} startAngle={90} endAngle={-270} paddingAngle={0} cornerRadius={20} isAnimationActive={true}>
                                        <Cell fill={isOver ? '#EF4444' : item.color} />
                                        <Cell fill="#E5E7EB" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <p className="font-semibold dark:text-gray-200">{item.name}</p>
                            <p className={`text-sm ${isOver ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>{item.value} / {item.goal}</p>
                        </div>
                    )
                })}
            </div>
             <div className="mt-6 p-4 bg-soft-mint rounded-lg text-center text-brand-mint font-semibold dark:bg-brand-mint/20">
                <p>Great job staying on track today!</p>
            </div>
        </div>
    );
};

const SymptomTipsScreen: React.FC = () => {
    const symptoms = [{name: 'Nausea', icon: '🤢'}, {name: 'Fatigue', icon: '⚡'}];
    return <div className="p-6 animate-fade-in"><h2 className="text-2xl font-bold dark:text-white">Symptom-Based Tips</h2><p className="text-gray-500 mt-2 dark:text-gray-400">Feature coming soon.</p></div>;
};

const ProgressJournalScreen: React.FC = () => {
    const data = [
        { name: 'Mon', weight: 70, energy: 7 },
        { name: 'Tue', weight: 70.2, energy: 6 },
        { name: 'Wed', weight: 70.1, energy: 8 },
        { name: 'Thu', weight: 69.9, energy: 7 },
        { name: 'Fri', weight: 69.8, energy: 9 },
    ];
    return (
        <div className="p-6 animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Progress Journal</h2>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="weight" fill="#8884d8" name="Weight (kg)" isAnimationActive={true}/>
                    <Bar yAxisId="right" dataKey="energy" fill="#82ca9d" name="Energy (1-10)" isAnimationActive={true}/>
                </BarChart>
            </ResponsiveContainer>
             <div className="mt-6 p-4 bg-yellow-100 rounded-lg text-center text-yellow-800 font-semibold dark:bg-yellow-900/50 dark:text-yellow-300">
                <p>You're improving! Keep going!</p>
            </div>
            <button className="w-full bg-brand-purple text-white font-bold py-3 rounded-xl mt-4 dark:bg-brand-purple/80 dark:hover:bg-brand-purple">Add New Entry</button>
        </div>
    );
};

const RemindersScreen: React.FC = () => {
    return <div className="p-6 animate-fade-in"><h2 className="text-2xl font-bold dark:text-white">Reminders & Alerts</h2><p className="text-gray-500 mt-2 dark:text-gray-400">Feature coming soon.</p></div>;
};

const LibraryScreen: React.FC = () => {
  const articles = [
    { title: "Healthy Recipes for Chemo", img: "https://picsum.photos/seed/recipes/200/100" },
    { title: "Managing Side Effects", img: "https://picsum.photos/seed/manage/200/100" },
    { title: "The Power of Hydration", img: "https://picsum.photos/seed/water/200/100" },
  ];
  return (
    <div className="p-4 animate-fade-in">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Offline Library</h1>
      <div className="space-y-4 animate-stagger-children">
        {articles.map((article, index) => (
          <div key={article.title} className="flex items-center bg-white p-3 rounded-lg shadow-sm dark:bg-gray-800" style={{ animationDelay: `${index * 100}ms` }}>
            <img src={article.img} alt={article.title} className="w-24 h-16 rounded-md object-cover mr-4" />
            <span className="font-semibold text-gray-700 flex-grow dark:text-gray-300">{article.title}</span>
            <button className="text-gray-400 dark:text-gray-500">&#x2B07;</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PremiumScreen: React.FC = () => (
  <div className="p-6 text-center flex flex-col items-center justify-center h-full animate-fade-in">
    <div className="border-2 border-brand-purple border-dashed p-8 rounded-xl dark:border-brand-purple/50">
      <PremiumIcon className="w-16 h-16 text-brand-purple mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Need extra guidance?</h2>
      <p className="text-gray-600 mt-2 dark:text-gray-400">Upgrade to chat with a certified nutritionist.</p>
      <button className="mt-6 bg-brand-purple text-white font-bold py-2 px-6 rounded-lg">Upgrade Now</button>
    </div>
  </div>
);


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
                <UserIcon className="w-24 h-24 text-gray-400 bg-gray-200 rounded-full p-4 mb-4 dark:bg-gray-700 dark:text-gray-400" />
                <h2 className="text-2xl font-bold dark:text-white">{userProfile.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{userProfile.email}</p>
            </div>
            <div className="space-y-3 animate-stagger-children">
                {menuItems.map((item, index) => (
                    <button 
                        key={item.label}
                        onClick={item.action} 
                        className="w-full text-left bg-gray-100 p-3 rounded-lg flex justify-between items-center dark:bg-gray-700 dark:text-gray-200"
                        style={{ animationDelay: `${200 + index * 100}ms` }}
                    >
                        <span>{item.label}</span>
                        {item.isToggle && (
                            <span className="capitalize bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-md text-sm">
                                {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                            </span>
                        )}
                    </button>
                ))}
                <button 
                  onClick={onLogout} 
                  className="w-full text-left bg-red-100 text-red-600 p-3 rounded-lg font-semibold dark:bg-red-900/50 dark:text-red-400"
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
    premium: <PremiumScreen />,
    profile: <ProfileScreen userProfile={userProfile} onLogout={onLogout} />,
  }), [userProfile, onLogout]);

  const CurrentPage = pages[activePage] || pages.home;

  return (
    <div className="pb-20 relative min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pt-4">{CurrentPage}</div>
      <EmergencyButton />
      <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
      {modalContent && <Modal closeModal={() => setModalContent(null)}>{modalContent}</Modal>}
    </div>
  );
};

export default Dashboard;