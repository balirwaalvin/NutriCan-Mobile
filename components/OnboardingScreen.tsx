
import React, { useState } from 'react';
import { ChevronLeftIcon } from './Icons';

interface OnboardingScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

const onboardingSlides = [
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FSlide%20Image%2FPerson%20on%20health%20food.png?alt=media&token=28737d8c-043a-45bf-8c72-bbb28120a143',
    title: 'Personalized Meal Plans',
    caption: 'Get personalized meal plans for your cancer journey.',
  },
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FSlide%20Image%2Fphone%20with%20charts.png?alt=media&token=e44dce9a-0354-4dcd-9ec3-125fa4fe7426',
    title: 'Track Your Progress',
    caption: 'Track your progress and get daily tips.',
  },
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/studio-3160139606-b516b.firebasestorage.app/o/NutriCan%2FSlide%20Image%2Fdoctor%20on%20phone.png?alt=media&token=afc9b7e2-717a-455d-96b2-47774b046185',
    title: 'Chat With Your Doctor',
    caption: 'Chat with your doctor anytime.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onBack }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else {
      onBack();
    }
  };

  const slide = onboardingSlides[currentSlide];

  return (
    <div className="flex flex-col h-screen bg-transparent p-8 text-center justify-between relative">
      <button 
        onClick={handleBack} 
        className="absolute top-6 left-6 z-20 p-2 bg-white/50 dark:bg-slate-800/50 rounded-full text-emerald-900 dark:text-white hover:bg-white/80 dark:hover:bg-slate-700 transition-all shadow-sm backdrop-blur-sm active:scale-95"
        aria-label="Go back"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>

      <div className="flex-grow flex flex-col items-center justify-center" key={currentSlide}>
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-200 rounded-full filter blur-xl opacity-30 animate-pulse"></div>
            <img src={slide.image} alt={slide.title} className="w-64 h-48 object-cover rounded-2xl shadow-xl relative z-10 animate-fade-in filter drop-shadow-md" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-900 dark:text-gray-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{slide.title}</h2>
        <p className="text-gray-600 mt-4 max-w-xs dark:text-gray-400 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.4s' }}>{slide.caption}</p>
      </div>
      <div className="flex items-center justify-center space-x-2 mb-8">
        {onboardingSlides.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${currentSlide === index ? 'bg-emerald-500 w-8' : 'bg-emerald-200 w-2 dark:bg-slate-700'}`}
          />
        ))}
      </div>
      <button
        onClick={handleNext}
        className="btn-primary"
      >
        {currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
      </button>
    </div>
  );
};

export default OnboardingScreen;
