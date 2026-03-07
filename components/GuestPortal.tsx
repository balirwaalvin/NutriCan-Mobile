
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, WeeklyMealPlan, Meal } from '../types';
import { generateMealPlan } from '../services/geminiService';
import { LogoIcon } from './Icons';

// ─── Icons ────────────────────────────────────────────────────────────────────
const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// ─── Swap-locked Modal ────────────────────────────────────────────────────────
const SignUpModal: React.FC<{
    title: string;
    message: string;
    onSignUp: () => void;
    onClose: () => void;
}> = ({ title, message, onSignUp, onClose }) => (
    <div
        className="fixed inset-0 bg-emerald-950/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-6 animate-fade-in"
        onClick={onClose}
    >
        <div
            className="bg-white dark:bg-emerald-900/70 max-w-sm w-full rounded-[3.5rem] p-10 text-center shadow-2xl relative border-b-8 border-brand-green overflow-hidden animate-fade-in-up"
            onClick={e => e.stopPropagation()}
        >
            {/* Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-green/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-7 right-7 p-2.5 rounded-full bg-gray-100 dark:bg-white/10 text-emerald-800 dark:text-white hover:scale-110 transition-transform"
            >
                <XIcon className="w-5 h-5" />
            </button>

            {/* Lock icon */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-amber-400/20 blur-3xl animate-pulse-soft rounded-full" />
                <div className="w-24 h-24 bg-white dark:bg-emerald-900/40 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto relative border-2 border-amber-400/30 shadow-2xl">
                    <LockIcon className="w-12 h-12 text-amber-500" />
                </div>
            </div>

            <span className="px-4 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 mb-5 inline-block">
                Account Required
            </span>

            <h2 className="text-2xl font-black text-emerald-950 dark:text-white mb-3 tracking-tighter">{title}</h2>
            <p className="text-gray-500 dark:text-gray-300 font-bold text-sm mb-8 leading-relaxed">{message}</p>

            {/* Perks */}
            <div className="w-full text-left space-y-3 mb-8 px-2">
                {[
                    'AI Meal Swaps & Customisation',
                    'Nutrient Tracker & Journal',
                    'Live AI Nutrition Consultation',
                    'Full Resource Library',
                ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow">
                            <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-bold text-emerald-950 dark:text-white">{perk}</span>
                    </div>
                ))}
            </div>

            {/* CTAs */}
            <div className="space-y-3">
                <div className="card-button-wrapper">
                    <button
                        onClick={onSignUp}
                        className="btn-primary w-full shadow-glow-large uppercase tracking-widest text-xs py-5"
                    >
                        Create Free Account
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="block w-full text-center text-xs font-black text-gray-400 uppercase tracking-widest pt-2 active:scale-95 transition-transform"
                >
                    Continue Browsing
                </button>
            </div>
        </div>
    </div>
);

// ─── Meal Card ────────────────────────────────────────────────────────────────
const GuestMealCard: React.FC<{
    meal: Meal;
    label: string;
    onSwapBlocked: () => void;
}> = ({ meal, label, onSwapBlocked }) => (
    <div className="glass-panel rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up group relative border border-white/40">
        <div className="relative h-48 overflow-hidden">
            <img src={meal.photoUrl} alt={meal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 to-transparent" />
            <div className="absolute bottom-6 left-8 right-8">
                <span className="text-[9px] font-black uppercase text-brand-green bg-white px-3 py-1 rounded-full mb-2 inline-block shadow-lg tracking-widest">{label}</span>
                <p className="font-black text-2xl text-white drop-shadow-2xl">{meal.name}</p>
            </div>
        </div>
        <div className="p-8">
            <p className="text-gray-600 text-sm mb-6 dark:text-emerald-100/70 leading-relaxed font-bold">{meal.description}</p>
            <div className="mb-8 p-5 bg-emerald-50 dark:bg-emerald-900/30 rounded-[2rem] border-l-4 border-brand-green shadow-inner">
                <p className="text-xs text-emerald-900 dark:text-emerald-100 italic font-medium leading-relaxed">"{meal.reason}"</p>
            </div>
            {/* Locked swap button */}
            <div className="card-button-wrapper">
                <button
                    onClick={onSwapBlocked}
                    className="w-full !text-base flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 border-2 border-amber-400/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors active:scale-95"
                >
                    <LockIcon className="w-4 h-4 flex-shrink-0" />
                    Sign Up to Swap
                </button>
            </div>
        </div>
    </div>
);

// ─── Main GuestPortal ─────────────────────────────────────────────────────────
interface GuestPortalProps {
    userProfile: UserProfile;
    onSignUp: () => void;  // routes back to Auth
}

const GuestPortal: React.FC<GuestPortalProps> = ({ userProfile, onSignUp }) => {
    const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState((new Date().getDay() + 6) % 7);
    const [showModal, setShowModal] = useState(false);

    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const fetchPlan = useCallback(async () => {
        setLoading(true);
        const plan = await generateMealPlan(userProfile);
        setMealPlan(plan);
        setLoading(false);
    }, [userProfile]);

    useEffect(() => { fetchPlan(); }, [fetchPlan]);

    return (
        <div className="min-h-screen bg-transparent flex flex-col">

            {/* ── Sticky guest header ──────────────────────────────────────── */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 bg-amber-500 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/20 rounded-xl">
                        <LockIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-black text-xs uppercase tracking-widest leading-none">Guest Mode</p>
                        <p className="text-white/80 text-[10px] font-bold mt-0.5">Viewing meal plan only</p>
                    </div>
                </div>
                <button
                    onClick={onSignUp}
                    className="bg-white text-amber-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl shadow-md active:scale-95 transition-transform"
                >
                    Sign Up Free
                </button>
            </div>

            {/* ── Content ──────────────────────────────────────────────────── */}
            <div className="flex-1 p-4 pb-56">
                <h2 className="text-3xl font-black mb-2 text-emerald-950 dark:text-white tracking-tight mt-4">Your Meal Plan</h2>
                <p className="text-gray-500 dark:text-emerald-300/60 font-bold text-sm mb-8">
                    Personalised for your condition · <span className="text-amber-500">Sign up to unlock full features</span>
                </p>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <LogoIcon className="animate-spin h-16 w-16 mb-4" />
                        <p className="font-black text-emerald-900 dark:text-emerald-300">Building your personalised menu...</p>
                    </div>
                )}

                {!loading && mealPlan && (
                    <>
                        {/* Day selector */}
                        <div className="flex justify-between gap-2 mb-10 bg-emerald-100/50 dark:bg-emerald-900/20 p-2 rounded-[2.5rem] overflow-x-auto no-scrollbar shadow-inner border border-emerald-500/10">
                            {DAY_LABELS.map((day, i) => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(i)}
                                    className={`px-5 py-3 rounded-2xl font-black text-[11px] transition-all duration-300 ${selectedDay === i
                                        ? 'bg-brand-green text-white shadow-glow-primary scale-105'
                                        : 'text-emerald-900/40 dark:text-white/40'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        {/* Meal cards */}
                        <div key={selectedDay} className="space-y-10 animate-fade-in">
                            {(['breakfast', 'lunch', 'dinner'] as const).map((type) => (
                                <GuestMealCard
                                    key={type}
                                    meal={mealPlan[selectedDay][type]}
                                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                                    onSwapBlocked={() => setShowModal(true)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {!loading && !mealPlan && (
                    <div className="text-center py-20">
                        <p className="text-gray-500 font-bold">Failed to load meal plan. Please check your connection.</p>
                        <button onClick={fetchPlan} className="mt-4 btn-primary px-8 py-3 text-sm">Retry</button>
                    </div>
                )}
            </div>

            {/* ── Fixed bottom CTA ─────────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 w-full sm:max-w-md md:max-w-lg mx-auto
                            bg-white/90 dark:bg-emerald-950/95 backdrop-blur-2xl
                            border-t border-white/20 px-5 pt-5 pb-10 z-40
                            shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] rounded-t-[2.5rem]">
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-emerald-900/40 dark:text-white/30 mb-4">
                    Unlock the Full NutriCan Experience
                </p>
                <div className="space-y-3">
                    <div className="card-button-wrapper">
                        <button
                            onClick={onSignUp}
                            className="btn-primary w-full shadow-glow-large uppercase tracking-widest text-xs py-4"
                            id="guest-portal-signup-btn"
                        >
                            Create Free Account
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 font-bold">
                        Or tap <span className="text-amber-500 font-black">Sign Up Free</span> at the top to get started instantly
                    </p>
                </div>
            </div>

            {/* ── Swap-blocked modal ────────────────────────────────────────── */}
            {showModal && (
                <SignUpModal
                    title="Swap Meals with a Free Account"
                    message="Create your free account to swap meals and get AI-powered meal customisation. Sign up takes less than a minute."
                    onSignUp={() => { setShowModal(false); onSignUp(); }}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default GuestPortal;
