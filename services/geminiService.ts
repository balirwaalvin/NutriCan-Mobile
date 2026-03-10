
import { UserProfile, FoodSafetyResult, FoodSafetyStatus, WeeklyMealPlan, Meal, NutrientInfo, SymptomType, RecommendedFood, DoctorProfile, ChatMessage } from '../types';
import { API_BASE_URL } from './config';

// ── Helper: authenticated POST to the AI backend ──────────────────────────────
async function aiPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const token = localStorage.getItem('nutrican_token') ?? '';
  const res = await fetch(`${API_BASE_URL}/api/ai/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || `AI request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// --- Comprehensive Image Mapping for Ugandan Meals ---
const FOOD_IMAGE_MAP: { [key: string]: string } = {
    // --- Staples (Carbs) ---
    'matoke': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Matoke.JPG/1280px-Matoke.JPG',
    'bananas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Matoke.JPG/1280px-Matoke.JPG',
    'plantain': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Matoke.JPG/1280px-Matoke.JPG',
    'posho': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ugali_%26_Sukuma_Wiki.jpg/1280px-Ugali_%26_Sukuma_Wiki.jpg',
    'ugali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ugali_%26_Sukuma_Wiki.jpg/1280px-Ugali_%26_Sukuma_Wiki.jpg',
    'maize': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ugali_%26_Sukuma_Wiki.jpg/1280px-Ugali_%26_Sukuma_Wiki.jpg',
    'corn': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ugali_%26_Sukuma_Wiki.jpg/1280px-Ugali_%26_Sukuma_Wiki.jpg',
    'rice': 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80',
    'pilau': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
    'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
    'irish': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
    'sweet potato': 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=800&q=80',
    'yams': 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=800&q=80',
    'cassava': 'https://images.unsplash.com/photo-1635352690947-68b209424c08?w=800&q=80',
    'kalo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Millet_porridge.jpg/1280px-Millet_porridge.jpg',
    'millet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Millet_porridge.jpg/1280px-Millet_porridge.jpg',
    'pumpkin': '/Meals/Steamed Pumpkin with Groundnuts Sauce.png',
    'chapati': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&q=80',
    'rolex': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Rolex_Uganda.jpg/1280px-Rolex_Uganda.jpg',
    'katogo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Matoke.JPG/1280px-Matoke.JPG',
    'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    'toast': 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    'oats': 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=800&q=80',
    'porridge': '/Meals/Porridge (Millet).png',

    // --- Proteins ---
    'fish': 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?w=800&q=80',
    'tilapia': 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?w=800&q=80',
    'perch': 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?w=800&q=80',
    'mukene': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Dried_fish_market.jpg/1280px-Dried_fish_market.jpg',
    'silver fish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Dried_fish_market.jpg/1280px-Dried_fish_market.jpg',
    'chicken': '/Meals/Grilled Chicken with Roasted Irish Potatoes.png',
    'luwombo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Luwombo.jpg/1280px-Luwombo.jpg',
    'beef': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80',
    'meat': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80',
    'goat': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80', 
    'liver': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80',
    'egg': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
    'beans': '/Meals/Boiled Sweet Potatoes with Beans.png',
    'peas': 'https://images.unsplash.com/photo-1589178347738-963b51676dfc?w=800&q=80',
    'cowpeas': 'https://images.unsplash.com/photo-1589178347738-963b51676dfc?w=800&q=80',
    'g-nut': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'groundnut': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'peanut': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'yoghurt': '/Meals/yougurt and avocado.png',
    'yogurt': '/Meals/yougurt and avocado.png',
    'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',

    // --- Vegetables ---
    'greens': '/Meals/Grilled Fish (Tilapia) with Greens.png',
    'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    'dodo': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    'nakati': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    'sukuma': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    'vegetable': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    'cabbage': 'https://images.unsplash.com/photo-1611099831778-98e3b567d12f?w=800&q=80',
    'avocado': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&q=80',
    'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'garden egg': 'https://images.unsplash.com/photo-1615485925763-867862f80c6c?w=800&q=80',
    'eggplant': 'https://images.unsplash.com/photo-1615485925763-867862f80c6c?w=800&q=80',
    'ntula': 'https://images.unsplash.com/photo-1615485925763-867862f80c6c?w=800&q=80',
    'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&q=80',

    // --- Fruits ---
    'fruit': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80',
    'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&q=80',
    'pineapple': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=800&q=80',
    'watermelon': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
    'papaya': 'https://images.unsplash.com/photo-1617117557561-44ca703ae50f?w=800&q=80',
    'pawpaw': 'https://images.unsplash.com/photo-1617117557561-44ca703ae50f?w=800&q=80',
    'orange': 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800&q=80',
    'passion': 'https://images.unsplash.com/photo-1536617066864-41da0045f442?w=800&q=80',
    'apple': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&q=80',

    // --- General/Misc ---
    'tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80',
    'juice': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80',
    'stew': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    'soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    // --- Extra compound aliases (longest-first sort makes these win over short keys) ---
    'nile perch': 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?w=800&q=80',
    'g-nut sauce': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'groundnut sauce': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'groundnut stew': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'chicken stew': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
    'chicken luwombo': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
    'beef stew': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80',
    'goat stew': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80',
    'millet porridge': '/Meals/Porridge (Millet).png',
    'maize porridge': '/Meals/Porridge (Millet).png',
    'fruit salad': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80',
    'mixed fruit': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80',
    'passion fruit': 'https://images.unsplash.com/photo-1536617066864-41da0045f442?w=800&q=80',
    'irish potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
    'boiled egg': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
    'scrambled egg': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
    'fried egg': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
    'boiled yam': 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=800&q=80',
    'boiled potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80',
    'sukuma wiki': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    'nile': 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?w=800&q=80',
};

const getMealPhotoUrl = (mealName: string): string => {
    // High-quality fallback image (Unsplash) - Healthy Plate
    const defaultImage = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80';

    if (!mealName) return defaultImage;

    const lowerMealName = mealName.toLowerCase();

    // Sort keys longest-first so specific phrases like 'sweet potato' beat
    // shorter overlapping ones like 'potato', and 'garden egg' beats 'egg'.
    const sortedKeys = Object.keys(FOOD_IMAGE_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (lowerMealName.includes(key)) {
            return FOOD_IMAGE_MAP[key];
        }
    }

    return defaultImage;
};

// ── checkFoodSafety ──────────────────────────────────────────────────────────
export const checkFoodSafety = async (foodName: string, userProfile: UserProfile): Promise<FoodSafetyResult> => {
  try {
    const result = await aiPost<{ status: string; reason: string }>('food-safety', { foodName, userProfile });
    if (Object.values(FoodSafetyStatus).includes(result.status as FoodSafetyStatus) && result.reason) {
      return { status: result.status as FoodSafetyStatus, reason: result.reason };
    }
    throw new Error('Invalid response from AI.');
  } catch (error) {
    console.error('Error checking food safety:', error);
    return { status: FoodSafetyStatus.AVOID, reason: 'Could not verify safety. Please consult your doctor.' };
  }
};

// ── generateMealPlan ─────────────────────────────────────────────────────────
export const generateMealPlan = async (userProfile: UserProfile): Promise<WeeklyMealPlan | null> => {
  try {
    const { weekPlan } = await aiPost<{ weekPlan: any[] }>('meal-plan', { userProfile });
    if (Array.isArray(weekPlan) && weekPlan.length === 7) {
      return weekPlan.map((dayPlan: any) => ({
        ...dayPlan,
        breakfast: { ...dayPlan.breakfast, photoUrl: getMealPhotoUrl(dayPlan.breakfast.name) },
        lunch:     { ...dayPlan.lunch,      photoUrl: getMealPhotoUrl(dayPlan.lunch.name) },
        dinner:    { ...dayPlan.dinner,     photoUrl: getMealPhotoUrl(dayPlan.dinner.name) },
      }));
    }
    throw new Error('Invalid meal plan format from API.');
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return null;
  }
};

// ── swapMeal ─────────────────────────────────────────────────────────────────
export const swapMeal = async (userProfile: UserProfile, mealToSwap: Meal, day: string, mealType: string): Promise<Meal | null> => {
  try {
    const result = await aiPost<any>('swap-meal', { userProfile, mealToSwap, day, mealType });
    if (result.name && result.description && result.category) {
      return { ...result, photoUrl: getMealPhotoUrl(result.name) };
    }
    throw new Error('Invalid swap meal format from API.');
  } catch (error) {
    console.error('Error swapping meal:', error);
    return null;
  }
};

// ── getNutrientInfo ───────────────────────────────────────────────────────────
export const getNutrientInfo = async (mealName: string): Promise<NutrientInfo | null> => {
  try {
    const result = await aiPost<NutrientInfo>('nutrient-info', { mealName });
    if (typeof result.calories === 'number' && typeof result.sugar === 'number' && typeof result.salt === 'number') {
      return result;
    }
    throw new Error('Invalid nutrient info format from API.');
  } catch (error) {
    console.error('Error getting nutrient info:', error);
    return null;
  }
};

// ── getSymptomTips ────────────────────────────────────────────────────────────
export const getSymptomTips = async (symptom: SymptomType): Promise<RecommendedFood[] | null> => {
  try {
    const { recommendations } = await aiPost<{ recommendations: { name: string; description: string }[] }>('symptom-tips', { symptom });
    if (Array.isArray(recommendations)) {
      return recommendations.map((food) => ({
        name: food.name,
        description: food.description,
        photoUrl: getMealPhotoUrl(food.name),
      }));
    }
    throw new Error('Invalid symptom tips format from API.');
  } catch (error) {
    console.error('Error generating symptom tips:', error);
    return null;
  }
};

// ── getDoctorChatResponse ─────────────────────────────────────────────────────
export const getDoctorChatResponse = async (
    doctor: DoctorProfile,
    userProfile: UserProfile,
    history: ChatMessage[],
    newMessage: string
): Promise<string> => {
  try {
    const { reply } = await aiPost<{ reply: string }>('doctor-chat', { doctor, userProfile, history, newMessage });
    return reply || "I'm sorry, I'm having trouble connecting right now. Please try again.";
  } catch (error) {
    console.error('Error in doctor chat:', error);
    return 'I apologize, but I am currently unavailable. Please check your internet connection.';
  }
};
