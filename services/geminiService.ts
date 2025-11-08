

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, FoodSafetyResult, FoodSafetyStatus, WeeklyMealPlan, Meal, NutrientInfo, SymptomType, RecommendedFood } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

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
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
        }
    });

    const jsonString = response.text.trim();
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


export const generateMealPlan = async (userProfile: UserProfile): Promise<WeeklyMealPlan | null> => {
    const conditions = [userProfile.cancerType, ...userProfile.otherConditions].join(', ');
    const prompt = `
      Generate a 7-day weekly meal plan for a patient with ${conditions} and Cervical Cancer.
      The meals should be based on local Ugandan cuisine.
      Crucially, the plan must EXCLUDE sugary foods (like sodas, sweets), pastries, and any deep-fried items. Meals should be healthy and low in fat.
      For each meal (breakfast, lunch, dinner) of each day, provide a "name", a brief "description", and a "category".
      The "category" must be one of the following strings: "Protein", "Carbs", "Balanced", "Veggies".
      Respond in a single JSON object with a single key "weekPlan". The value should be an array of 7 day-objects.
      Each day-object should have a "day" (e.g., "Monday") and keys for "breakfast", "lunch", and "dinner".
      Example for one day-object in the array:
      {
        "day": "Monday",
        "breakfast": {"name": "Katogo", "description": "Matoke cooked with beef, a hearty start.", "category": "Balanced"},
        "lunch": {"name": "Steamed Fish with Greens", "description": "Fresh tilapia steamed in banana leaves with dodo.", "category": "Protein"},
        "dinner": {"name": "Groundnut Stew with Sweet Potatoes", "description": "Rich and savory g-nut sauce served with boiled sweet potatoes.", "category": "Balanced"}
      }
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                breakfast: { ...dayPlan.breakfast, photoUrl: `https://picsum.photos/seed/${dayPlan.breakfast.name.replace(/\s/g, '')}/400/300` },
                lunch: { ...dayPlan.lunch, photoUrl: `https://picsum.photos/seed/${dayPlan.lunch.name.replace(/\s/g, '')}/400/300` },
                dinner: { ...dayPlan.dinner, photoUrl: `https://picsum.photos/seed/${dayPlan.dinner.name.replace(/\s/g, '')}/400/300` },
            }));
        }
        throw new Error("Invalid meal plan format from API.");
    } catch (error) {
        console.error("Error generating meal plan:", error);
        return null;
    }
};

export const swapMeal = async (userProfile: UserProfile, mealToSwap: Meal, day: string, mealType: string): Promise<Meal | null> => {
    const conditions = [userProfile.cancerType, ...userProfile.otherConditions].join(', ');
    const prompt = `
        A patient with ${conditions} needs a replacement for their ${mealType} on ${day}.
        The current meal is "${mealToSwap.name}".
        Suggest a different, healthy Ugandan local dish.
        The new meal MUST NOT be sugary, a pastry, or deep-fried. It should be low-fat.
        Provide a "name", "description", and "category" ("Protein", "Carbs", "Balanced", or "Veggies").
        Respond in a single JSON object.
        Example: {"name": "Boiled Chicken and Yams", "description": "Simple, clean protein and complex carbs.", "category": "Protein"}
    `;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        const jsonString = response.text.trim();
        const newMealData = JSON.parse(jsonString);
        if (newMealData.name && newMealData.description && newMealData.category) {
            return {
                ...newMealData,
                photoUrl: `https://picsum.photos/seed/${newMealData.name.replace(/\s/g, '')}/400/300`,
            };
        }
        throw new Error("Invalid swap meal format from API.");
    } catch (error) {
        console.error("Error swapping meal:", error);
        return null;
    }
}

export const getNutrientInfo = async (mealName: string): Promise<NutrientInfo | null> => {
    const prompt = `
      Analyze the food "${mealName}" and provide its estimated nutritional values for a standard serving.
      Respond in JSON format with three keys: "calories" (number), "sugar" (number, in grams), and "salt" (number, in grams).
      Only return the JSON object, with no other text or markdown.
      Example: {"calories": 350, "sugar": 5, "salt": 0.5}
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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

export const getSymptomTips = async (symptom: SymptomType): Promise<RecommendedFood[] | null> => {
    const prompt = `
        Generate a list of recommended local Ugandan foods for a patient with cervical cancer experiencing ${symptom}.
        The foods should be easy to digest, healthy, and help alleviate the symptom.
        Avoid sugary, fried, spicy, or very fatty foods.
        Respond ONLY with a JSON object. The object should have a single key "recommendations", which is an array of objects.
        Each object in the array should have a "name" (string) and a "description" (string, max 20 words).
        Provide 3 to 5 recommendations.
        Example for Nausea:
        {
          "recommendations": [
            {"name": "Ginger Tea (Tangawizi)", "description": "Soothes the stomach and is known to effectively reduce nausea."},
            {"name": "Plain Posho", "description": "A bland, easy-to-digest carbohydrate that provides energy without upsetting the stomach."}
          ]
        }
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                photoUrl: `https://picsum.photos/seed/${food.name.replace(/\s/g, '')}/400/300`,
            }));
        }
        throw new Error("Invalid tips format from API.");
    } catch (error) {
        console.error("Error generating symptom tips:", error);
        return null;
    }
};