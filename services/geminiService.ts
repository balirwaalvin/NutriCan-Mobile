
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
  // --- Exact Meal Mappings ---
  'boiled cassava with g-nut sauce': '/Meals/Boiled Cassava with G-nut sauce.png',
  'boiled cassava with peas': '/Meals/Boiled Cassava with Peas.png',
  'boiled irish potatoes with peas': '/Meals/Boiled Irish Potatoes with Peas.png',
  'boiled kalo (millet) with cabbage and carrots': '/Meals/Boiled Kalo (Millet) with Cabbage and Carrots.png',
  'boiled kalo (millet) with cabbage': '/Meals/Boiled Kalo (Millet) with Cabbage.png',
  'boiled sweet potatoes with beans': '/Meals/Boiled Sweet Potatoes with Beans.png',
  'boiled sweet potatoes with groundnuts': '/Meals/Boiled Sweet Potatoes with Groundnuts.png',
  'boiled yams with groundnuts (g-nut sauce)': '/Meals/Boiled Yams with Groundnuts (G-nut sauce).png',
  'grilled beef with roasted irish potatoes': '/Meals/Grilled Beef with Roasted Irish Potatoes.png',
  'grilled beef with roasted yams': '/Meals/Grilled Beef with Roasted Yams.png',
  'grilled chicken (stew) with boiled yams': '/Meals/Grilled Chicken (Stew) with Boiled Yams.png',
  'grilled chicken with roasted irish potatoes': '/Meals/Grilled Chicken with Roasted Irish Potatoes.png',
  'grilled fish (nile perch) with roasted irish potatoes': '/Meals/Grilled Fish (Nile Perch) with Roasted Irish Potatoes.png',
  'grilled fish (nile perch) with roasted pumpkin': '/Meals/Grilled Fish (Nile Perch) with Roasted Pumpkin.png',
  'grilled fish (tilapia) with greens (sukuma wiki)': '/Meals/Grilled Fish (Tilapia) with Greens (Sukuma Wiki).png',
  'grilled fish (tilapia) with greens': '/Meals/Grilled Fish (Tilapia) with Greens.png',
  'grilled goat with boiled matoke': '/Meals/Grilled Goat with Boiled Matoke.png',
  'grilled goat with mixed greens (sukuma wiki, cabbage)': '/Meals/Grilled Goat with Mixed Greens (Sukuma Wiki, Cabbage).png',
  'porridge (millet)': '/Meals/Porridge (Millet).png',
  'scrambled eggs with nakati': '/Meals/Scrambled Eggs with Nakati.png',
  'scrambled eggs with spinach': '/Meals/Scrambled Eggs with Spinach.png',
  'steamed fish with mixed greens and sweet potatoes': '/Meals/Steamed Fish with Mixed Greens and Sweet Potatoes.png',
  'steamed greens with boiled sweet potatoes and beans': '/Meals/Steamed Greens with Boiled Sweet Potatoes and Beans.png',
  'steamed greens with boiled sweet potatoes': '/Meals/Steamed Greens with Boiled Sweet Potatoes.png',
  'steamed matoke with beans and greens': '/Meals/Steamed Matoke with Beans and Greens.png',
  'steamed matoke with greens': '/Meals/Steamed Matoke with Greens.png',
  'steamed pumpkin with groundnuts sauce': '/Meals/Steamed Pumpkin with Groundnuts Sauce.png',
  'yoghurt with watermelon': '/Meals/Yoghurt with Watermelon.png',
  'yougurt and avocado': '/Meals/yougurt and avocado.png',
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
        lunch: { ...dayPlan.lunch, photoUrl: getMealPhotoUrl(dayPlan.lunch.name) },
        dinner: { ...dayPlan.dinner, photoUrl: getMealPhotoUrl(dayPlan.dinner.name) },
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
