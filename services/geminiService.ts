
import { UserProfile, FoodSafetyResult, FoodSafetyStatus, WeeklyMealPlan, Meal, NutrientInfo, SymptomType, RecommendedFood, DoctorProfile, ChatMessage } from '../types';
import { GROQ_API_KEY } from './config';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getDefaultPortionByCategory(category?: string): string {
  switch (category) {
    case 'Protein':
      return '120-150g cooked serving';
    case 'Veggies':
      return '1.5-2 cups cooked vegetables';
    case 'Carbs':
      return '1 cup cooked serving';
    default:
      return '1 balanced plate';
  }
}

type MealFallbackMeta = {
  category: Meal['category'];
  portionSize: string;
  quantityDetails: string;
  nutrients: NutrientInfo;
};

const MEAL_FALLBACK_META: Record<string, MealFallbackMeta> = {
  'porridge (millet)': { category: 'Carbs', portionSize: '1 cup cooked porridge', quantityDetails: 'Take once at breakfast; add no sugar and pair with water or unsweetened tea.', nutrients: { calories: 220, sugar: 3, salt: 0.2, bmiImpact: 'Steady energy with moderate calories.' } },
  'scrambled eggs with spinach': { category: 'Protein', portionSize: '2 eggs + 1 cup spinach', quantityDetails: 'Take once at breakfast; use minimal oil and avoid extra salt.', nutrients: { calories: 280, sugar: 2, salt: 0.6, bmiImpact: 'Supports satiety and lean protein intake.' } },
  'scrambled eggs with nakati': { category: 'Protein', portionSize: '2 eggs + 1 cup nakati', quantityDetails: 'Take once at breakfast; cook with little oil and no added sugar.', nutrients: { calories: 270, sugar: 2, salt: 0.6, bmiImpact: 'High protein helps appetite control.' } },
  'yoghurt with watermelon': { category: 'Balanced', portionSize: '1 cup plain yoghurt + 1 cup watermelon', quantityDetails: 'Best as breakfast or snack once daily; choose unsweetened yoghurt.', nutrients: { calories: 240, sugar: 12, salt: 0.2, bmiImpact: 'Hydrating and moderate calorie load.' } },
  'yougurt and avocado': { category: 'Balanced', portionSize: '3/4 cup plain yoghurt + 1/2 avocado', quantityDetails: 'Take once daily; use unsweetened yoghurt for lower sugar.', nutrients: { calories: 290, sugar: 8, salt: 0.2, bmiImpact: 'Healthy fats improve fullness.' } },
  'steamed matoke with beans and greens': { category: 'Balanced', portionSize: '1 cup matoke + 1/2 cup beans + 1 cup greens', quantityDetails: 'Take once at lunch; keep beans portion measured to avoid excess calories.', nutrients: { calories: 430, sugar: 6, salt: 0.7, bmiImpact: 'Balanced carbs, fiber, and protein.' } },
  'boiled sweet potatoes with beans': { category: 'Balanced', portionSize: '1 medium sweet potato + 1/2 cup beans', quantityDetails: 'Take once at lunch; avoid adding oil-heavy sauces.', nutrients: { calories: 410, sugar: 7, salt: 0.5, bmiImpact: 'High fiber supports steady energy.' } },
  'grilled fish (tilapia) with greens': { category: 'Protein', portionSize: '150g fish + 1.5 cups greens', quantityDetails: 'Take once at lunch or dinner; grill/steam without deep frying.', nutrients: { calories: 360, sugar: 4, salt: 0.6, bmiImpact: 'Lean protein supports healthy weight goals.' } },
  'boiled cassava with peas': { category: 'Carbs', portionSize: '1 cup cassava + 1/2 cup peas', quantityDetails: 'Take once at lunch; add greens to increase plate balance.', nutrients: { calories: 440, sugar: 4, salt: 0.5, bmiImpact: 'Energy dense; portion control advised.' } },
  'steamed fish with mixed greens and sweet potatoes': { category: 'Balanced', portionSize: '130g fish + 1 cup greens + 1/2 cup sweet potatoes', quantityDetails: 'Take once at lunch or dinner; keep sweet potato portion moderate.', nutrients: { calories: 390, sugar: 5, salt: 0.6, bmiImpact: 'Good protein with controlled carbohydrate load.' } },
  'boiled yams with groundnuts (g-nut sauce)': { category: 'Carbs', portionSize: '1 cup yam + 2 tbsp g-nut sauce', quantityDetails: 'Take once at lunch; avoid oversized sauce portions.', nutrients: { calories: 460, sugar: 5, salt: 0.6, bmiImpact: 'Calorie dense due to sauce, measure carefully.' } },
  'grilled goat with boiled matoke': { category: 'Protein', portionSize: '120g goat meat + 1 cup matoke', quantityDetails: 'Take once at lunch/dinner; trim visible fat before grilling.', nutrients: { calories: 470, sugar: 4, salt: 0.7, bmiImpact: 'Higher protein meal; pair with vegetables.' } },
  'grilled chicken (stew) with boiled yams': { category: 'Protein', portionSize: '130g chicken + 3/4 cup yams', quantityDetails: 'Take once at dinner; use light stew with minimal oil.', nutrients: { calories: 420, sugar: 4, salt: 0.7, bmiImpact: 'Supports recovery while controlling portions.' } },
  'steamed greens with boiled sweet potatoes': { category: 'Veggies', portionSize: '1.5 cups greens + 1/2 cup sweet potatoes', quantityDetails: 'Take once at dinner; prioritize greens over starch.', nutrients: { calories: 300, sugar: 6, salt: 0.4, bmiImpact: 'Lower calorie, high-fiber dinner option.' } },
  'grilled fish (nile perch) with roasted pumpkin': { category: 'Protein', portionSize: '150g fish + 3/4 cup pumpkin', quantityDetails: 'Take once at dinner; avoid adding extra butter/oil.', nutrients: { calories: 370, sugar: 5, salt: 0.6, bmiImpact: 'Lean protein with moderate carbs.' } },
  'boiled irish potatoes with peas': { category: 'Carbs', portionSize: '1 cup potatoes + 1/2 cup peas', quantityDetails: 'Take once at dinner; add vegetables for better satiety.', nutrients: { calories: 390, sugar: 4, salt: 0.5, bmiImpact: 'Moderate calories when portions are controlled.' } },
  'steamed pumpkin with groundnuts sauce': { category: 'Balanced', portionSize: '1 cup pumpkin + 2 tbsp groundnut sauce', quantityDetails: 'Take once at dinner; keep sauce measured to reduce fat load.', nutrients: { calories: 350, sugar: 7, salt: 0.5, bmiImpact: 'Nutrient-rich but sauce raises calories.' } },
  'grilled beef with roasted yams': { category: 'Protein', portionSize: '120g beef + 3/4 cup yams', quantityDetails: 'Take once at dinner; choose lean beef cuts and limit oil.', nutrients: { calories: 480, sugar: 3, salt: 0.7, bmiImpact: 'Protein dense; pair with vegetables for balance.' } },
  'steamed matoke with greens': { category: 'Balanced', portionSize: '1 cup matoke + 1.5 cups greens', quantityDetails: 'Take once at dinner; keep matoke portion moderate.', nutrients: { calories: 340, sugar: 5, salt: 0.4, bmiImpact: 'Balanced high-fiber meal option.' } },
};

function getMealFallbackMeta(name: string): MealFallbackMeta | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return MEAL_FALLBACK_META[key] || null;
}

// ── Helper: call Groq API directly from the client ────────────────────────────
async function callGroqJSON<T>(prompt: string, systemPrompt: string = ''): Promise<T> {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.4,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API failed: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '{}';
  return JSON.parse(content) as T;
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

  // --- Ingredient/Symptom Tips Fallbacks (Unsplash) ---
  'ginger': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80',
  'posho': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80',
  'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
  'yoghurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
  'papaya': 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=800&q=80',
  'watermelon': 'https://images.unsplash.com/photo-1589332560835-24e6de858b47?w=800&q=80',
  'greens': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
  'beans': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=800&q=80',
  'fish': 'https://images.unsplash.com/photo-1511259551157-3a7c6b96eec5?w=800&q=80',
  'matoke': 'https://images.unsplash.com/photo-1603522206412-fcb0ad52f866?w=800&q=80',
  'banana': 'https://images.unsplash.com/photo-1603522206412-fcb0ad52f866?w=800&q=80',
  'pumpkin': 'https://images.unsplash.com/photo-1570586437263-bc624738222b?w=800&q=80',
  'egg': 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&q=80',
  'broth': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
  'tea': 'https://images.unsplash.com/photo-1576092762791-dd9e2220afa1?w=800&q=80',
  'porridge': 'https://images.unsplash.com/photo-1516714435131-44d6b636dc41?w=800&q=80',
  'water': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80',
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

const FALLBACK_BREAKFASTS = [
  'Porridge (Millet)',
  'Scrambled Eggs with Spinach',
  'Yoghurt with Watermelon',
  'Scrambled Eggs with Nakati',
  'yougurt and avocado',
  'Porridge (Millet)',
  'Scrambled Eggs with Spinach'
];

const FALLBACK_LUNCHES = [
  'Steamed Matoke with Beans and Greens',
  'Boiled Sweet Potatoes with Beans',
  'Grilled Fish (Tilapia) with Greens',
  'Boiled Cassava with Peas',
  'Steamed Fish with Mixed Greens and Sweet Potatoes',
  'Boiled Yams with Groundnuts (G-nut sauce)',
  'Grilled Goat with Boiled Matoke'
];

const FALLBACK_DINNERS = [
  'Grilled Chicken (Stew) with Boiled Yams',
  'Steamed Greens with Boiled Sweet Potatoes',
  'Grilled Fish (Nile Perch) with Roasted Pumpkin',
  'Boiled Irish Potatoes with Peas',
  'Steamed Pumpkin with Groundnuts Sauce',
  'Grilled Beef with Roasted Yams',
  'Steamed Matoke with Greens'
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeCategory(category: any): Meal['category'] {
  if (category === 'Protein' || category === 'Carbs' || category === 'Balanced' || category === 'Veggies') {
    return category;
  }
  return 'Balanced';
}

function toNumber(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function buildMealFromRaw(rawMeal: any, fallbackName: string): Meal {
  const name = typeof rawMeal?.name === 'string' && rawMeal.name.trim() ? rawMeal.name : fallbackName;
  const meta = getMealFallbackMeta(name);
  const category = normalizeCategory(rawMeal?.category || meta?.category);

  const nutrientSource = rawMeal?.nutrients || rawMeal?.nutrition || {};
  const calories = toNumber(nutrientSource?.calories ?? rawMeal?.calories);
  const sugar = toNumber(nutrientSource?.sugar ?? rawMeal?.sugar);
  const salt = toNumber(nutrientSource?.salt ?? rawMeal?.salt);
  const bmiImpact = typeof nutrientSource?.bmiImpact === 'string'
    ? nutrientSource.bmiImpact
    : (typeof rawMeal?.bmiImpact === 'string' ? rawMeal.bmiImpact : '');

  return {
    name,
    description: typeof rawMeal?.description === 'string' && rawMeal.description.trim()
      ? rawMeal.description
      : 'A recovery-friendly local meal option.',
    reason: typeof rawMeal?.reason === 'string' && rawMeal.reason.trim()
      ? rawMeal.reason
      : 'Chosen to support balanced nutrition during recovery.',
    category,
    recipe: typeof rawMeal?.recipe === 'string' ? rawMeal.recipe : 'Prepare with minimal oil and salt, then serve warm.',
    portionSize: typeof rawMeal?.portionSize === 'string' && rawMeal.portionSize.trim()
      ? rawMeal.portionSize
      : (meta?.portionSize || getDefaultPortionByCategory(category)),
    quantityDetails: typeof rawMeal?.quantityDetails === 'string' && rawMeal.quantityDetails.trim()
      ? rawMeal.quantityDetails
      : (meta?.quantityDetails || 'Take one measured serving for this meal time and drink water alongside.'),
    photoUrl: getMealPhotoUrl(name),
    nutrients: {
      calories: calories ?? meta?.nutrients.calories ?? 0,
      sugar: sugar ?? meta?.nutrients.sugar ?? 0,
      salt: salt ?? meta?.nutrients.salt ?? 0,
      bmiImpact: bmiImpact || meta?.nutrients.bmiImpact || ''
    }
  };
}

function buildFallbackWeekPlan(): WeeklyMealPlan {
  return WEEK_DAYS.map((day, index) => ({
    day,
    breakfast: buildMealFromRaw({ name: FALLBACK_BREAKFASTS[index], category: 'Balanced' }, FALLBACK_BREAKFASTS[index]),
    lunch: buildMealFromRaw({ name: FALLBACK_LUNCHES[index], category: 'Balanced' }, FALLBACK_LUNCHES[index]),
    dinner: buildMealFromRaw({ name: FALLBACK_DINNERS[index], category: 'Balanced' }, FALLBACK_DINNERS[index]),
  }));
}

// ── checkFoodSafety ──────────────────────────────────────────────────────────
export const checkFoodSafety = async (foodName: string, userProfile: UserProfile): Promise<FoodSafetyResult> => {
  const conditions = [userProfile.cancerType, ...(userProfile.otherConditions || [])].join(', ');
  const prompt = `
For a patient with the following conditions: ${conditions}.
Is the food "${foodName}" safe to eat?
Respond in JSON format with two keys: "status" and "reason".
"status" must be exactly one of: "Safe", "Limit", or "Avoid".
"reason" must be a brief one-line explanation.
Example: {"status": "Safe", "reason": "Rich in antioxidants and safe for ${userProfile.cancerType}."}
`;

  try {
    const result = await callGroqJSON<{ status: string; reason: string }>(prompt);
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
  const conditions = [userProfile.cancerType, ...(userProfile.otherConditions || [])].join(', ');
  let bmiInfo = '';
  let bmiValue = 0;
  if (userProfile.height && userProfile.weight) {
    const h = userProfile.height / 100;
    bmiValue = parseFloat((userProfile.weight / (h * h)).toFixed(1));
    let status = 'Healthy Weight';
    if (bmiValue < 18.5) status = 'Underweight';
    else if (bmiValue >= 25 && bmiValue < 30) status = 'Overweight';
    else if (bmiValue >= 30) status = 'Obese';
    bmiInfo = `The patient's BMI is ${bmiValue} (${status}).`;
  }

  const prompt = `
Generate a 7-day weekly meal plan for a patient with ${conditions} and Cervical Cancer.
${bmiInfo}
ADDITIONAL INSTRUCTIONS: Generate nutrient information (nutrients: { calories, sugar, salt, bmiImpact }) for each meal in the plan.

CRITICAL: You MUST ONLY recommend meals from this EXACT list, word-for-word. Do not invent or modify meal names:
- Boiled Cassava with G-nut sauce
- Boiled Cassava with Peas
- Boiled Irish Potatoes with Peas
- Boiled Kalo (Millet) with Cabbage and Carrots
- Boiled Kalo (Millet) with Cabbage
- Boiled Sweet Potatoes with Beans
- Boiled Sweet Potatoes with Groundnuts
- Boiled Yams with Groundnuts (G-nut sauce)
- Grilled Beef with Roasted Irish Potatoes
- Grilled Beef with Roasted Yams
- Grilled Chicken (Stew) with Boiled Yams
- Grilled Chicken with Roasted Irish Potatoes
- Grilled Fish (Nile Perch) with Roasted Irish Potatoes
- Grilled Fish (Nile Perch) with Roasted Pumpkin
- Grilled Fish (Tilapia) with Greens (Sukuma Wiki)
- Grilled Fish (Tilapia) with Greens
- Grilled Goat with Boiled Matoke
- Grilled Goat with Mixed Greens (Sukuma Wiki, Cabbage)
- Porridge (Millet)
- Scrambled Eggs with Nakati
- Scrambled Eggs with Spinach
- Steamed Fish with Mixed Greens and Sweet Potatoes
- Steamed Greens with Boiled Sweet Potatoes and Beans
- Steamed Greens with Boiled Sweet Potatoes
- Steamed Matoke with Beans and Greens
- Steamed Matoke with Greens
- Steamed Pumpkin with Groundnuts Sauce
- Yoghurt with Watermelon
- yougurt and avocado

Do NOT suggest obscure local dishes not in this list. Combine them to form a complete 7-day meal plan.
EXCLUDE sugary foods (sodas, cakes), pastries, and deep-fried items.

For each meal (breakfast, lunch, dinner) of each day provide:
1. "name" (from the list above)
2. "description"
3. "reason" (why recommended based on BMI ${bmiValue} and condition, max 2 sentences)
4. "category" (must be "Protein", "Carbs", "Balanced", or "Veggies")
5. "recipe" (short step-by-step healthy recipe)
6. "portionSize" (specific quantity per serving, e.g. "1 cup", "150g", "2 medium pieces")
7. "quantityDetails" (detailed guidance: frequency, plate composition, and practical serving tips in 1-2 short sentences)
8. "nutrients" (an object containing "calories" (number), "sugar" (in grams, number), "salt" (in grams, number), and "bmiImpact" (string short explanation))

Respond as a JSON object with a single key "weekPlan" containing an array of 7 day-objects.
Each day-object has: "day" (e.g. "Monday"), "breakfast", "lunch", "dinner".
`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await callGroqJSON<any>(prompt);
      const rawWeekPlan = Array.isArray(response?.weekPlan)
        ? response.weekPlan
        : Array.isArray(response?.mealPlan)
          ? response.mealPlan
          : Array.isArray(response?.plan)
            ? response.plan
            : [];

      if (!Array.isArray(rawWeekPlan) || rawWeekPlan.length === 0) {
        throw new Error('Invalid meal plan format from API.');
      }

      return WEEK_DAYS.map((dayName, index) => {
        const dayPlan = rawWeekPlan[index] || {};
        return {
          day: typeof dayPlan?.day === 'string' && dayPlan.day.trim() ? dayPlan.day : dayName,
          breakfast: buildMealFromRaw(dayPlan?.breakfast, FALLBACK_BREAKFASTS[index]),
          lunch: buildMealFromRaw(dayPlan?.lunch, FALLBACK_LUNCHES[index]),
          dinner: buildMealFromRaw(dayPlan?.dinner, FALLBACK_DINNERS[index]),
        };
      });
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : '';
      const isRateLimited = message.includes('rate_limit_exceeded') || message.includes('429');

      if (attempt < 2 && isRateLimited) {
        await delay(4500);
        continue;
      }

      console.error('Error generating meal plan:', error);
      break;
    }
  }

  // Guaranteed fallback so the UI never gets stuck without meal plans.
  return buildFallbackWeekPlan();
};

// ── swapMeal ─────────────────────────────────────────────────────────────────
export const swapMeal = async (userProfile: UserProfile, mealToSwap: Meal, day: string, mealType: string): Promise<Meal | null> => {
  const conditions = [userProfile.cancerType, ...(userProfile.otherConditions || [])].join(', ');
  let bmiInfo = '';
  if (userProfile.height && userProfile.weight) {
    const h = userProfile.height / 100;
    const bmi = (userProfile.weight / (h * h)).toFixed(1);
    bmiInfo = `The patient's BMI is ${bmi}.`;
  }

  const prompt = `
A patient with ${conditions} (${bmiInfo}) needs a replacement for their ${mealType} on ${day}.
The current meal is "${mealToSwap.name}".
Suggest a DIFFERENT healthy Ugandan local dish.

CRITICAL: You MUST ONLY choose from this EXACT list, word-for-word. Do not invent or modify meal names:
- Boiled Cassava with G-nut sauce
- Boiled Cassava with Peas
- Boiled Irish Potatoes with Peas
- Boiled Kalo (Millet) with Cabbage and Carrots
- Boiled Kalo (Millet) with Cabbage
- Boiled Sweet Potatoes with Beans
- Boiled Sweet Potatoes with Groundnuts
- Boiled Yams with Groundnuts (G-nut sauce)
- Grilled Beef with Roasted Irish Potatoes
- Grilled Beef with Roasted Yams
- Grilled Chicken (Stew) with Boiled Yams
- Grilled Chicken with Roasted Irish Potatoes
- Grilled Fish (Nile Perch) with Roasted Irish Potatoes
- Grilled Fish (Nile Perch) with Roasted Pumpkin
- Grilled Fish (Tilapia) with Greens (Sukuma Wiki)
- Grilled Fish (Tilapia) with Greens
- Grilled Goat with Boiled Matoke
- Grilled Goat with Mixed Greens (Sukuma Wiki, Cabbage)
- Porridge (Millet)
- Scrambled Eggs with Nakati
- Scrambled Eggs with Spinach
- Steamed Fish with Mixed Greens and Sweet Potatoes
- Steamed Greens with Boiled Sweet Potatoes and Beans
- Steamed Greens with Boiled Sweet Potatoes
- Steamed Matoke with Beans and Greens
- Steamed Matoke with Greens
- Steamed Pumpkin with Groundnuts Sauce
- Yoghurt with Watermelon
- yougurt and avocado

Must NOT be sugary, a pastry, or deep-fried. Should be low-fat.

Provide: "name", "description", "reason" (why good for their BMI and conditions), "category" ("Protein", "Carbs", "Balanced", or "Veggies"), "recipe" (short step-by-step recipe), "portionSize" (specific quantity), "quantityDetails" (detailed serving guidance), and "nutrients" (object with "calories", "sugar", "salt", "bmiImpact").
Respond as a single JSON object.
Example: {"name": "Boiled Chicken and Yams", "description": "Simple protein and complex carbs.", "reason": "High protein aids tissue repair.", "category": "Protein", "recipe": "1. Boil chicken. 2. Boil yams. 3. Serve together.", "portionSize": "150g chicken + 1 cup yams", "quantityDetails": "Take once at this meal time; fill half the plate with vegetables and avoid extra salt.", "nutrients": {"calories": 300, "sugar": 5, "salt": 1, "bmiImpact": "Helps maintain muscle mass without excess calories."}}
`;

  try {
    const result = await callGroqJSON<any>(prompt);
    if (result.name && result.description && result.category) {
      return { 
        ...result, 
        photoUrl: getMealPhotoUrl(result.name),
        portionSize: result.portionSize || getDefaultPortionByCategory(result.category),
        quantityDetails: result.quantityDetails || 'Use one measured serving for this meal time and keep oil minimal.',
        nutrients: result.nutrients || { calories: 0, sugar: 0, salt: 0, bmiImpact: '' }
      };
    }
    throw new Error('Invalid swap meal format from API.');
  } catch (error) {
    console.error('Error swapping meal:', error);
    return null;
  }
};

// ── getNutrientInfo ───────────────────────────────────────────────────────────
export const getNutrientInfo = async (mealName: string): Promise<NutrientInfo | null> => {
  const prompt = `
Analyze the food "${mealName}" and provide estimated nutritional values for a standard serving.
Respond in JSON with three keys: "calories" (number), "sugar" (number, in grams), "salt" (number, in grams).
Only return the JSON object with no other text.
Example: {"calories": 350, "sugar": 5, "salt": 0.5}
`;

  try {
    const result = await callGroqJSON<NutrientInfo>(prompt);
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
  const prompt = `
Generate a list of 4-5 highly specific local Ugandan food recommendations for a cervical cancer patient experiencing "${symptom}".
Focus on foods scientifically or traditionally known to help with "${symptom}" specifically.
Use ONLY common foods from: Ginger, Posho, Rice, Yoghurt, Papaya, Watermelon, Greens, Beans, Fish, Matoke, Pumpkin, Eggs.

Respond ONLY as a JSON object with a single key "recommendations" — an array of objects each having "name" (string), "description" (string, max 20 words), and "howToProvide" (string, short instructions on how the user can take it).
Example: {"recommendations": [{"name": "Ginger Tea", "description": "Soothes the stomach and effectively reduces nausea.", "howToProvide": "Steep fresh ginger in hot water and sip slowly."}]}
`;

  try {
    const { recommendations } = await callGroqJSON<{ recommendations: { name: string; description: string; howToProvide?: string }[] }>(prompt);
    if (Array.isArray(recommendations)) {
      return recommendations.map((food) => ({
        name: food.name,
        description: food.description,
        howToProvide: food.howToProvide || '',
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
  const bmi =
    userProfile.height && userProfile.weight
      ? (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1)
      : 'Unknown';

  const systemInstruction = `You are ${doctor.name}, a ${doctor.specialty} with NutriCan.
Your Persona: ${doctor.personality}.
Patient Context:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Condition: ${userProfile.cancerType} (${userProfile.cancerStage})
- Comorbidities: ${(userProfile.otherConditions || []).join(', ') || 'None'}
- BMI: ${bmi}
- Treatment: ${(userProfile.treatmentStages || []).join(', ') || 'Not specified'}
Instructions:
- Respond to the user's latest message in character.
- Keep advice medically sound but relevant to Ugandan/East African context where possible.
- Be concise (max 3-4 sentences typically).
- If the user shares a system report (starts with [Health Report]), analyze it briefly and give encouragement.`;

  const messages = [{ role: 'system', content: systemInstruction }];
  if (Array.isArray(history)) {
    for (const msg of history) {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text,
      });
    }
  }
  messages.push({ role: 'user', content: newMessage });

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 300,
      })
    });

    if (!res.ok) {
      throw new Error(`Groq API failed: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "I'm sorry, I'm having trouble connecting right now. Please try again.";
  } catch (error) {
    console.error('Error in doctor chat:', error);
    return 'I apologize, but I am currently unavailable. Please check your internet connection.';
  }
};
