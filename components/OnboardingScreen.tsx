import React, { useState } from 'react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const onboardingSlides = [
  {
    image: 'https://picsum.photos/seed/healthyfood/400/300',
    title: 'Personalized Meal Plans',
    caption: 'Get personalized meal plans for your cancer journey.',
  },
  {
    image: 'https://picsum.photos/seed/mobilecharts/400/300',
    title: 'Track Your Progress',
    caption: 'Track your progress and get daily tips.',
  },
  {
    image: 'https://picsum.photos/seed/doctorvideo/400/300',
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
    <div className="flex flex-col h-screen bg-soft-lavender p-8 text-center justify-between dark:bg-gray-900">
      <div className="flex-grow flex flex-col items-center justify-center" key={currentSlide}>
        <img src={slide.image} alt={slide.title} className="w-64 h-48 object-cover rounded-2xl shadow-lg mb-8 animate-fade-in" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>{slide.title}</h2>
        <p className="text-gray-600 mt-2 max-w-xs dark:text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>{slide.caption}</p>
      </div>
      <div className="flex items-center justify-center space-x-2 mb-6">
        {onboardingSlides.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? 'bg-brand-purple w-6' : 'bg-gray-300'}`}
          />
        ))}
      </div>
      <button
        onClick={handleNext}
        className="w-full bg-brand-purple text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-brand-purple/90 transition-transform transform hover:scale-105"
      >
        {currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
      </button>
    </div>
  );
};

export default OnboardingScreen;