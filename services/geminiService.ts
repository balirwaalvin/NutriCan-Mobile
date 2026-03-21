
import { UserProfile, FoodSafetyResult, FoodSafetyStatus, WeeklyMealPlan, Meal, NutrientInfo, SymptomType, RecommendedFood, DoctorProfile, ChatMessage } from '../types';
import { GROQ_API_KEY } from './config';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

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
6. "nutrients" (an object containing "calories" (number), "sugar" (in grams, number), "salt" (in grams, number), and "bmiImpact" (string short explanation))

Respond as a JSON object with a single key "weekPlan" containing an array of 7 day-objects.
Each day-object has: "day" (e.g. "Monday"), "breakfast", "lunch", "dinner".
`;

  try {
    const { weekPlan } = await callGroqJSON<{ weekPlan: any[] }>(prompt);
    if (Array.isArray(weekPlan) && weekPlan.length === 7) {
      return weekPlan.map((dayPlan: any) => ({
        ...dayPlan,
        breakfast: { 
          ...dayPlan.breakfast, 
          photoUrl: getMealPhotoUrl(dayPlan.breakfast.name),
          nutrients: dayPlan.breakfast.nutrients || { calories: 0, sugar: 0, salt: 0, bmiImpact: '' }
        },
        lunch: { 
          ...dayPlan.lunch, 
          photoUrl: getMealPhotoUrl(dayPlan.lunch.name),
          nutrients: dayPlan.lunch.nutrients || { calories: 0, sugar: 0, salt: 0, bmiImpact: '' }
        },
        dinner: { 
          ...dayPlan.dinner, 
          photoUrl: getMealPhotoUrl(dayPlan.dinner.name),
          nutrients: dayPlan.dinner.nutrients || { calories: 0, sugar: 0, salt: 0, bmiImpact: '' }
        },
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

Provide: "name", "description", "reason" (why good for their BMI and conditions), "category" ("Protein", "Carbs", "Balanced", or "Veggies"), "recipe" (short step-by-step recipe), and "nutrients" (object with "calories", "sugar", "salt", "bmiImpact").
Respond as a single JSON object.
Example: {"name": "Boiled Chicken and Yams", "description": "Simple protein and complex carbs.", "reason": "High protein aids tissue repair.", "category": "Protein", "recipe": "1. Boil chicken. 2. Boil yams. 3. Serve together.", "nutrients": {"calories": 300, "sugar": 5, "salt": 1, "bmiImpact": "Helps maintain muscle mass without excess calories."}}
`;

  try {
    const result = await callGroqJSON<any>(prompt);
    if (result.name && result.description && result.category) {
      return { 
        ...result, 
        photoUrl: getMealPhotoUrl(result.name),
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
