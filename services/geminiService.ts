
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { UserProfile, FoodSafetyResult, FoodSafetyStatus, WeeklyMealPlan, Meal, NutrientInfo, SymptomType, RecommendedFood, DoctorProfile, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
    'pumpkin': 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=800&q=80',
    'chapati': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&q=80',
    'rolex': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Rolex_Uganda.jpg/1280px-Rolex_Uganda.jpg',
    'katogo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Matoke.JPG/1280px-Matoke.JPG',
    'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    'toast': 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    'oats': 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=800&q=80',
    'porridge': 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=800&q=80',

    // --- Proteins ---
    'fish': 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?w=800&q=80',
    'tilapia': 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?w=800&q=80',
    'perch': 'https://images.unsplash.com/photo-1519708227418-c8fd9a3a2b7b?w=800&q=80',
    'mukene': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Dried_fish_market.jpg/1280px-Dried_fish_market.jpg',
    'silver fish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Dried_fish_market.jpg/1280px-Dried_fish_market.jpg',
    'chicken': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
    'luwombo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Luwombo.jpg/1280px-Luwombo.jpg',
    'beef': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80',
    'meat': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80',
    'goat': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80', 
    'liver': 'https://images.unsplash.com/photo-1574484284008-be9d6e50cc3d?w=800&q=80',
    'egg': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
    'beans': 'https://images.unsplash.com/photo-1590741270415-467406a445d0?w=800&q=80',
    'peas': 'https://images.unsplash.com/photo-1589178347738-963b51676dfc?w=800&q=80',
    'cowpeas': 'https://images.unsplash.com/photo-1589178347738-963b51676dfc?w=800&q=80',
    'g-nut': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'groundnut': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'peanut': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=800&q=80',
    'yoghurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    'yogurt': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
    'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',

    // --- Vegetables ---
    'greens': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
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
};

const getMealPhotoUrl = (mealName: string): string => {
    // High-quality fallback image (Unsplash) - Healthy Plate
    const defaultImage = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80'; 
    
    if (!mealName) return defaultImage;

    const lowerMealName = mealName.toLowerCase();
    
    // Check if any key in our map exists in the meal name string
    for (const key in FOOD_IMAGE_MAP) {
        if (lowerMealName.includes(key)) {
            return FOOD_IMAGE_MAP[key];
        }
    }

    // If no specific match, returns the default to ensure NO broken images.
    return defaultImage;
};

// Fixed model name to 'gemini-3-flash-preview' for text tasks.
export const checkFoodSafety = async (foodName: string, userProfile: UserProfile): Promise<FoodSafetyResult> => {
  const conditions = [userProfile.cancerType, ...userProfile.otherConditions].join(', ');
  const prompt = `
    For a patient with the following conditions: ${conditions}.
    Is the food "${foodName}" safe to eat?
    Respond in JSON format with two keys: "status" and "reason".
    The "status" should be one of three values: "Safe", "Limit", or "Avoid".
    The "reason" should be a brief, one-line explanation.
    Example: {"status": "Safe", "reason": "Rich in antioxidants and safe for ${userProfile.cancerType}."}
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
        }
    });

    const jsonString = response.text?.trim() || "{}";
    const result = JSON.parse(jsonString);
    
    if (Object.values(FoodSafetyStatus).includes(result.status) && result.reason) {
        return {
            status: result.status as FoodSafetyStatus,
            reason: result.reason,
        };
    }
    
    throw new Error("Invalid response format from Gemini API");

  } catch (error) {
    console.error("Error checking food safety:", error);
    // Provide a default error response
    return {
      status: FoodSafetyStatus.AVOID,
      reason: "Could not verify safety. Please consult your doctor.",
    };
  }
};

// Fixed model name to 'gemini-3-flash-preview'.
export const generateMealPlan = async (userProfile: UserProfile): Promise<WeeklyMealPlan | null> => {
    const conditions = [userProfile.cancerType, ...userProfile.otherConditions].join(', ');
    
    let bmiInfo = '';
    let bmiValue = 0;
    if (userProfile.height && userProfile.weight) {
        const heightInMeters = userProfile.height / 100;
        bmiValue = parseFloat((userProfile.weight / (heightInMeters * heightInMeters)).toFixed(1));
        let status = 'Healthy Weight';
        if (bmiValue < 18.5) status = 'Underweight';
        else if (bmiValue >= 25 && bmiValue < 30) status = 'Overweight';
        else if (bmiValue >= 30) status = 'Obese';
        
        bmiInfo = `The patient's BMI is ${bmiValue} (${status}).`;
    }

    // UPDATED PROMPT: Strictly restricts output to common Ugandan foods in our Image Map
    const prompt = `
      Generate a 7-day weekly meal plan for a patient with ${conditions} and Cervical Cancer.
      ${bmiInfo}
      
      CRITICAL INSTRUCTION: You must ONLY recommend meal items from the following list of common Ugandan foods to ensure valid images are available:
      - Staples: Matoke, Rice, Posho, Sweet Potatoes, Irish Potatoes, Cassava, Yams, Kalo (Millet), Pumpkin, Chapati (only if healthy).
      - Proteins: Beans, Peas, Groundnuts (G-nut sauce), Fish (Tilapia, Nile Perch, Mukene), Chicken (Stew/Luwombo), Beef, Goat, Eggs, Yoghurt.
      - Vegetables: Greens (Dodo, Nakati, Sukuma Wiki), Cabbage, Spinach, Avocado, Garden Eggs (Ntula).
      - Fruits: Watermelon, Pineapple, Papaya (Pawpaw), Mango, Passion Fruit, Oranges.
      - Drinks: Water, Milk Tea (limit sugar), Porridge (Millet/Maize), Fruit Juice.

      Do NOT suggest obscure local dishes that are not in the list above.
      
      The plan must EXCLUDE sugary foods (sodas, cakes), pastries, and deep-fried items. Meals should be healthy and low in fat.
      
      For each meal (breakfast, lunch, dinner) of each day, provide:
      1. "name" (Use the names from the list above, e.g., "Matoke with G-nut Sauce")
      2. "description"
      3. "reason" (Explain precisely why this meal is recommended based on their BMI of ${bmiValue} and condition. Max 2 sentences.)
      4. "category" (Must be "Protein", "Carbs", "Balanced", or "Veggies").
      5. "recipe" (A short, step-by-step healthy recipe for preparing this meal).
      
      Respond in a single JSON object with a single key "weekPlan". The value should be an array of 7 day-objects.
      Each day-object should have a "day" (e.g., "Monday") and keys for "breakfast", "lunch", and "dinner".
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result.weekPlan && Array.isArray(result.weekPlan) && result.weekPlan.length === 7) {
            return result.weekPlan.map((dayPlan: any) => ({
                ...dayPlan,
                breakfast: { ...dayPlan.breakfast, photoUrl: getMealPhotoUrl(dayPlan.breakfast.name) },
                lunch: { ...dayPlan.lunch, photoUrl: getMealPhotoUrl(dayPlan.lunch.name) },
                dinner: { ...dayPlan.dinner, photoUrl: getMealPhotoUrl(dayPlan.dinner.name) },
            }));
        }
        throw new Error("Invalid meal plan format from API.");
    } catch (error) {
        console.error("Error generating meal plan:", error);
        return null;
    }
};

// Fixed model name to 'gemini-3-flash-preview'.
export const swapMeal = async (userProfile: UserProfile, mealToSwap: Meal, day: string, mealType: string): Promise<Meal | null> => {
    const conditions = [userProfile.cancerType, ...userProfile.otherConditions].join(', ');
    
    let bmiInfo = '';
    if (userProfile.height && userProfile.weight) {
        const heightInMeters = userProfile.height / 100;
        const bmi = (userProfile.weight / (heightInMeters * heightInMeters)).toFixed(1);
        bmiInfo = `The patient's BMI is ${bmi}.`;
    }

    const prompt = `
        A patient with ${conditions} (${bmiInfo}) needs a replacement for their ${mealType} on ${day}.
        The current meal is "${mealToSwap.name}".
        Suggest a different, healthy Ugandan local dish.
        
        CRITICAL: ONLY choose from these supported foods:
        Matoke, Rice, Posho, Sweet Potatoes, Cassava, Yams, Kalo, Pumpkin, Beans, Peas, G-nut sauce, Fish, Chicken, Beef, Goat, Eggs, Greens, Cabbage, Avocado.
        
        The new meal MUST NOT be sugary, a pastry, or deep-fried. It should be low-fat.
        Provide a "name", "description", "reason" (Why is this specific swap good for their BMI and conditions?), "category" ("Protein", "Carbs", "Balanced", or "Veggies"), and "recipe" (A short, step-by-step healthy recipe).
        Respond in a single JSON object.
        Example: {"name": "Boiled Chicken and Yams", "description": "Simple, clean protein and complex carbs.", "reason": "High protein aids tissue repair while yams offer digestible energy suitable for their weight goals.", "category": "Protein", "recipe": "1. Boil chicken with herbs. 2. Boil yams until soft. 3. Serve together."}
    `;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        const jsonString = response.text?.trim() || "{}";
        const newMealData = JSON.parse(jsonString);
        if (newMealData.name && newMealData.description && newMealData.category) {
            return {
                ...newMealData,
                photoUrl: getMealPhotoUrl(newMealData.name),
            };
        }
        throw new Error("Invalid swap meal format from API.");
    } catch (error) {
        console.error("Error swapping meal:", error);
        return null;
    }
}

// Fixed model name to 'gemini-3-flash-preview'.
export const getNutrientInfo = async (mealName: string): Promise<NutrientInfo | null> => {
    const prompt = `
      Analyze the food "${mealName}" and provide its estimated nutritional values for a standard serving.
      Respond in JSON format with three keys: "calories" (number), "sugar" (number, in grams), and "salt" (number, in grams).
      Only return the JSON object, with no other text or markdown.
      Example: {"calories": 350, "sugar": 5, "salt": 0.5}
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        
        if (typeof result.calories === 'number' && typeof result.sugar === 'number' && typeof result.salt === 'number') {
            return {
                calories: result.calories,
                sugar: result.sugar,
                salt: result.salt,
            };
        }
        
        throw new Error("Invalid response format from Gemini API for nutrient info.");

    } catch (error) {
        console.error("Error getting nutrient info:", error);
        return null;
    }
};

// Fixed model name to 'gemini-3-flash-preview'.
export const getSymptomTips = async (symptom: SymptomType): Promise<RecommendedFood[] | null> => {
    const prompt = `
        Generate a list of 4-5 highly specific and effective local Ugandan food recommendations for a patient with cervical cancer experiencing ${symptom}.
        Focus on foods that are scientifically or traditionally known to help with ${symptom} specifically.
        Use ONLY common foods from this list to ensure images are available: Ginger, Posho, Rice, Yoghurt, Papaya, Watermelon, Greens, Beans, Fish, Matoke, Pumpkin, Eggs.
        
        For example, if the symptom is Nausea, suggest ginger, dry crackers, or bland foods. 
        If the symptom is Constipation, suggest high fiber foods like papayas or green vegetables.
        The recommendations MUST be distinct and tailored to ${symptom}.
        Respond ONLY with a JSON object. The object should have a single key "recommendations", which is an array of objects.
        Each object in the array should have a "name" (string) and a "description" (string, max 20 words).
        
        Example structure:
        {
          "recommendations": [
            {"name": "Ginger Tea", "description": "Soothes the stomach and is known to effectively reduce nausea."},
            {"name": "Plain Posho", "description": "A bland, easy-to-digest carbohydrate that provides energy without upsetting the stomach."}
          ]
        }
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result.recommendations && Array.isArray(result.recommendations)) {
            return result.recommendations.map((food: any) => ({
                name: food.name,
                description: food.description,
                photoUrl: getMealPhotoUrl(food.name),
            }));
        }
        throw new Error("Invalid tips format from API.");
    } catch (error) {
        console.error("Error generating symptom tips:", error);
        return null;
    }
};

// --- Doctor Connect AI Logic ---

// Fixed model name to 'gemini-3-pro-preview' for complex medical character chat.
export const getDoctorChatResponse = async (
    doctor: DoctorProfile,
    userProfile: UserProfile,
    history: ChatMessage[],
    newMessage: string
): Promise<string> => {
    // 1. Build Persona
    const bmi = userProfile.height && userProfile.weight ? (userProfile.weight / ((userProfile.height / 100) ** 2)).toFixed(1) : "Unknown";
    
    const systemInstruction = `
        You are ${doctor.name}, a ${doctor.specialty} with NutriCan.
        
        Your Persona: ${doctor.personality}.
        
        Patient Context:
        - Name: ${userProfile.name}
        - Age: ${userProfile.age}
        - Condition: ${userProfile.cancerType} (${userProfile.cancerStage})
        - Comorbidities: ${userProfile.otherConditions.join(', ') || 'None'}
        - BMI: ${bmi}
        - Treatment: ${userProfile.treatmentStages.join(', ') || 'Not specified'}

        Instructions:
        - Respond to the user's latest message in character.
        - Keep advice medically sound but relevant to Ugandan/East African context where possible (local foods).
        - Be concise (max 3-4 sentences typically).
        - If the user shares a system report (starts with [Health Report]), analyze it briefly and give encouragement.
    `;

    // 2. Format History for Gemini API
    const formattedHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    try {
        const chat: Chat = ai.chats.create({
            model: 'gemini-3-pro-preview',
            config: {
                systemInstruction: systemInstruction,
            },
            history: formattedHistory as any,
        });

        const response: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
        return response.text || "I'm sorry, I'm having trouble connecting right now. Please try again.";
    } catch (error) {
        console.error("Error in doctor chat:", error);
        return "I apologize, but I'm currently unavailable. Please check your internet connection.";
    }
};
