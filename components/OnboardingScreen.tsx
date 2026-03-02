
import React, { useState } from 'react';
import { ChevronLeftIcon } from './Icons';

interface OnboardingScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

const onboardingSlides = [
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FSlide%20Image%2FPerson%20on%20health%20food.png?alt=media&token=28737d8c-043a-45bf-8c72-bbb28120a143',
    title: 'Precision Nutrition',
    caption: 'Scientifically crafted meal plans designed for your unique recovery path.',
  },
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FSlide%20Image%2Fphone%20with%20charts.png?alt=media&token=e44dce9a-0354-4dcd-9ec3-125fa4fe7426',
    title: 'Progress Intelligence',
    caption: 'Track symptoms and wellness trends with AI-driven visual insights.',
  },
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FSlide%20Image%2Fdoctor%20on%20phone.png?alt=media&token=afc9b7e2-717a-455d-96b2-47774b046185',
    title: 'Instant Expert Access',
    caption: 'Connect with specialists and get real-time voice guidance whenever needed.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const handleNext = () => currentSlide < onboardingSlides.length - 1 ? setCurrentSlide(currentSlide + 1) : onComplete();
  const handleBack = () => currentSlide > 0 ? setCurrentSlide(currentSlide - 1) : onBack();
  const slide = onboardingSlides[currentSlide];

  return (
    <div className="flex flex-col h-screen bg-transparent p-8 text-center justify-between relative overflow-hidden">
      <button onClick={handleBack} className="absolute top-8 left-8 p-3 glass-panel rounded-full shadow-lg active:scale-90 transition-all z-20">
        <ChevronLeftIcon className="w-6 h-6 text-emerald-900 dark:text-white" />
      </button>
      <div className="flex-grow flex flex-col items-center justify-center animate-fade-in-up" key={currentSlide}>
        <div className="relative mb-12">
            <div className="absolute inset-0 bg-brand-green/30 blur-[80px] rounded-full animate-pulse-soft"></div>
            <img src={slide.image} alt={slide.title} className="w-72 h-56 object-cover rounded-[3rem] shadow-2xl relative z-10 border-4 border-white/30" />
        </div>
        <h2 className="text-3xl font-black text-emerald-950 dark:text-white tracking-tight leading-tight">{slide.title}</h2>
        <p className="text-gray-500 mt-6 max-w-xs dark:text-emerald-100/60 font-bold leading-relaxed">{slide.caption}</p>
      </div>
      <div className="pb-10">
          <div className="flex items-center justify-center space-x-3 mb-12">
            {onboardingSlides.map((_, index) => (
              <div key={index} className={`h-2.5 rounded-full transition-all duration-500 ${currentSlide === index ? 'bg-brand-green w-10' : 'bg-emerald-200 w-2.5 dark:bg-emerald-900/40'}`} />
            ))}
          </div>
          <div className="card-button-wrapper">
            <button onClick={handleNext} className="btn-primary w-full text-xl shadow-glow-large">
              {currentSlide === onboardingSlides.length - 1 ? 'Start Journey' : 'Continue'}
            </button>
          </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
