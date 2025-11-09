import React, { useState } from 'react';

interface OnboardingScreenProps {
  onComplete: () => void;
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
    caption: 'Chat with your doctor anytime (Premium).',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const slide = onboardingSlides[currentSlide];

  return (
    <div className="flex flex-col h-screen bg-transparent p-8 text-center justify-between">
      <div className="flex-grow flex flex-col items-center justify-center" key={currentSlide}>
        <img src={slide.image} alt={slide.title} className="w-64 h-48 object-cover rounded-2xl shadow-lg mb-8 animate-fade-in filter drop-shadow-lg" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{slide.title}</h2>
        <p className="text-gray-600 mt-2 max-w-xs dark:text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>{slide.caption}</p>
      </div>
      <div className="flex items-center justify-center space-x-2 mb-6">
        {onboardingSlides.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? 'bg-brand-orange w-6' : 'bg-gray-300 dark:bg-slate-600'}`}
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