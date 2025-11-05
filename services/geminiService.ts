
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, FoodSafetyResult, FoodSafetyStatus, MealPlan } from '../types';

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


export const generateMealPlan = async (userProfile: UserProfile): Promise<MealPlan | null> => {
    const conditions = [userProfile.cancerType, ...userProfile.otherConditions].join(', ');
    const prompt = `
      Generate a one-day meal plan (breakfast, lunch, dinner) for a patient with ${conditions}.
      For each meal, provide a "name" and a "description".
      Respond in a JSON object with keys "breakfast", "lunch", and "dinner".
      Each key should be an object with "name" and "description" strings.
      Example: {
        "breakfast": {"name": "Oatmeal with Berries", "description": "A warm and fiber-rich start to the day."},
        "lunch": {"name": "Grilled Chicken Salad", "description": "Lean protein with fresh greens and a light vinaigrette."},
        "dinner": {"name": "Baked Salmon with Quinoa", "description": "Omega-3 rich fish with a complete protein side."}
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
        const plan = JSON.parse(jsonString);

        if (plan.breakfast && plan.lunch && plan.dinner) {
            return {
                breakfast: { ...plan.breakfast, photoUrl: `https://picsum.photos/seed/${plan.breakfast.name.replace(/\s/g, '')}/400/300`, nutrients: {protein: 20, carbs: 40, fat: 10} },
                lunch: { ...plan.lunch, photoUrl: `https://picsum.photos/seed/${plan.lunch.name.replace(/\s/g, '')}/400/300`, nutrients: {protein: 35, carbs: 30, fat: 15} },
                dinner: { ...plan.dinner, photoUrl: `https://picsum.photos/seed/${plan.dinner.name.replace(/\s/g, '')}/400/300`, nutrients: {protein: 30, carbs: 50, fat: 20} },
            };
        }
        throw new Error("Invalid meal plan format from API.");
    } catch (error) {
        console.error("Error generating meal plan:", error);
        return null;
    }
};
