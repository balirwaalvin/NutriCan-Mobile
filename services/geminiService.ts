

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UserProfile, FoodSafetyResult, FoodSafetyStatus, WeeklyMealPlan, Meal, NutrientInfo, SymptomType, RecommendedFood } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Image Mapping for Meals ---

const getMealPhotoUrl = (mealName: string): string => {
    // Use a reliable, general-purpose image as a fallback.
    const defaultImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/1280px-Good_Food_Display_-_NCI_Visuals_Online.jpg';
    if (!mealName) return defaultImage;

    // Map keywords to specific, high-availability images from Wikimedia Commons for maximum reliability
    const imageMap: { [key: string]: string } = {
        'fish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Fish_Mulligatawny_Soup.jpg/1024px-Fish_Mulligatawny_Soup.jpg',
        'tilapia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Fish_Mulligatawny_Soup.jpg/1024px-Fish_Mulligatawny_Soup.jpg',
        'nile perch': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Fish_Mulligatawny_Soup.jpg/1024px-Fish_Mulligatawny_Soup.jpg',
        'mukene': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Dried_fish_market.jpg/1280px-Dried_fish_market.jpg',
        'chicken': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Luwombo.jpg/1280px-Luwombo.jpg',
        'luwombo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Luwombo.jpg/1280px-Luwombo.jpg',
        'stew': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Beef_stew_with_potatoes_and_carrots.jpg/1280px-Beef_stew_with_potatoes_and_carrots.jpg',
        'beef': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Beef_stew_with_potatoes_and_carrots.jpg/1280px-Beef_stew_with_potatoes_and_carrots.jpg',
        'goat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Goat_Curry.jpg/1280px-Goat_Curry.jpg',
        'katogo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Matoke.JPG/1280px-Matoke.JPG',
        'matoke': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Matoke.JPG/1280px-Matoke.JPG',
        'plantain': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Matoke.JPG/1280px-Matoke.JPG',
        'posho': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ugali_%26_Sukuma_Wiki.jpg/1280px-Ugali_%26_Sukuma_Wiki.jpg',
        'ugali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ugali_%26_Sukuma_Wiki.jpg/1280px-Ugali_%26_Sukuma_Wiki.jpg',
        'greens': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg/1280px-Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg',
        'dodo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg/1280px-Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg',
        'nakati': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg/1280px-Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg',
        'spinach': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg/1280px-Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg',
        'sukuma': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg/1280px-Sukuma_wiki_-_gegr%C3%BCnter_Gr%C3%BCnkohl.jpg',
        'cabbage': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Kopytka_z_kiszona_kapusta_02.jpg/1280px-Kopytka_z_kiszona_kapusta_02.jpg',
        'vegetable': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Vegetable_Stir_Fry.jpg/1280px-Vegetable_Stir_Fry.jpg',
        'potatoes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/1280px-Patates.jpg',
        'irish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Patates.jpg/1280px-Patates.jpg',
        'fruit': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Culinary_fruits_front_view.jpg/1280px-Culinary_fruits_front_view.jpg',
        'salad': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Salad_platter.jpg/1280px-Salad_platter.jpg',
        'porridge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Millet_porridge.jpg/1280px-Millet_porridge.jpg',
        'oats': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Oatmeal_with_berries.jpg/1024px-Oatmeal_with_berries.jpg',
        'millet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Millet_porridge.jpg/1280px-Millet_porridge.jpg',
        'kalo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Millet_porridge.jpg/1280px-Millet_porridge.jpg',
        'groundnut': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Groundnut_Stew_-_Peanut_Butter_Stew_-_Maafe.jpg/1280px-Groundnut_Stew_-_Peanut_Butter_Stew_-_Maafe.jpg',
        'g-nut': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Groundnut_Stew_-_Peanut_Butter_Stew_-_Maafe.jpg/1280px-Groundnut_Stew_-_Peanut_Butter_Stew_-_Maafe.jpg',
        'peanut': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Groundnut_Stew_-_Peanut_Butter_Stew_-_Maafe.jpg/1280px-Groundnut_Stew_-_Peanut_Butter_Stew_-_Maafe.jpg',
        'binyebwa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Groundnut_Stew_-_Peanut_Butter_Stew_-_Maafe.jpg/1280px-Groundnut_Stew_-_Peanut_Butter_Stew_-_Maafe.jpg',
        'egg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Avocado_toast_with_egg.jpg/1280px-Avocado_toast_with_egg.jpg',
        'rolex': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Rolex_Uganda.jpg/1280px-Rolex_Uganda.jpg',
        'avocado': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Avocado_toast_with_egg.jpg/1280px-Avocado_toast_with_egg.jpg',
        'beans': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Rajma_chawal_1.jpg/1280px-Rajma_chawal_1.jpg',
        'rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/White_rice.jpg/1280px-White_rice.jpg',
        'pilau': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/White_rice.jpg/1280px-White_rice.jpg',
        'peas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Split_pea_soup.jpg/1280px-Split_pea_soup.jpg',
        'cowpeas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Split_pea_soup.jpg/1280px-Split_pea_soup.jpg',
        'cassava': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Mogo_%26_cassava%29.jpg/1280px-Mogo_%26_cassava%29.jpg',
        'yam': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Boiled_Sweet_Potatoes.jpg/1280px-Boiled_Sweet_Potatoes.jpg',
        'sweet potato': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Boiled_Sweet_Potatoes.jpg/1280px-Boiled_Sweet_Potatoes.jpg',
        'pumpkin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/French_soup.jpg/1280px-French_soup.jpg',
        'soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Vegetarian_Curry.jpeg/1280px-Vegetarian_Curry.jpeg',
        'broth': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Vegetarian_Curry.jpeg/1280px-Vegetarian_Curry.jpeg',
        'chapati': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Chapati_02.jpg/1280px-Chapati_02.jpg',
        'tea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Tea_plantations_in_Munnar%2C_Kerala.jpg/1280px-Tea_plantations_in_Munnar%2C_Kerala.jpg',
        'drink': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Tea_plantations_in_Munnar%2C_Kerala.jpg/1280px-Tea_plantations_in_Munnar%2C_Kerala.jpg',
        'ginger': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Ginger_Root.jpg/1280px-Ginger_Root.jpg',
        'lemon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Lemon.jpg/1280px-Lemon.jpg',
        'mango': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Hapus_Mango.jpg/1280px-Hapus_Mango.jpg',
        'pineapple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Pineapple_and_cross_section.jpg/1280px-Pineapple_and_cross_section.jpg',
        'watermelon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Taiwan_2009_Tainan_City_Organic_Farm_Watermelon.jpg/1280px-Taiwan_2009_Tainan_City_Organic_Farm_Watermelon.jpg',
        'papaya': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Papaya_cross_section_BNC.jpg/1280px-Papaya_cross_section_BNC.jpg',
        'orange': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Oranges_-_whole-halved-segment.jpg/1280px-Oranges_-_whole-halved-segment.jpg',
        'passion': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Passion_fruit_packed_with_edible_seeds.jpg/1280px-Passion_fruit_packed_with_edible_seeds.jpg',
        'juice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Glass_of_orange_juice.jpg/1280px-Glass_of_orange_juice.jpg',
        'water': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Glass_of_water.jpg/800px-Glass_of_water.jpg',
        'hydration': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Glass_of_water.jpg/800px-Glass_of_water.jpg',
        'yoghurt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Bowl_of_yogurt.jpg/1280px-Bowl_of_yogurt.jpg',
        'yogurt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Bowl_of_yogurt.jpg/1280px-Bowl_of_yogurt.jpg',
        'milk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Glass_of_Milk_%2833657535532%29.jpg/1280px-Glass_of_Milk_%2833657535532%29.jpg',
        'cracker': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Cream_crackers_stack.jpg/1280px-Cream_crackers_stack.jpg',
        'biscuit': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Cream_crackers_stack.jpg/1280px-Cream_crackers_stack.jpg',
        'toast': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Toast-2.jpg/1280px-Toast-2.jpg',
        'bread': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Toast-2.jpg/1280px-Toast-2.jpg',
        'ice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Strawberry_ice_cream_cone_%285076899310%29.jpg/1280px-Strawberry_ice_cream_cone_%285076899310%29.jpg',
        'cold': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Strawberry_ice_cream_cone_%285076899310%29.jpg/1280px-Strawberry_ice_cream_cone_%285076899310%29.jpg',
    };

    const lowerMealName = mealName.toLowerCase();
    for (const key in imageMap) {
        if (lowerMealName.includes(key)) {
            return imageMap[key];
        }
    }

    return defaultImage;
};


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
    
    // Calculate BMI
    // Weight in kg, Height in cm. Formula: kg / m^2
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

    const prompt = `
      Generate a 7-day weekly meal plan for a patient with ${conditions} and Cervical Cancer.
      ${bmiInfo}
      The meals should be based on local Ugandan cuisine.
      Crucially, the plan must EXCLUDE sugary foods (like sodas, sweets), pastries, and any deep-fried items. Meals should be healthy and low in fat.
      For each meal (breakfast, lunch, dinner) of each day, provide:
      1. "name"
      2. "description"
      3. "reason" (Explain precisely why this meal is recommended based on their BMI of ${bmiValue} and condition. If underweight, focus on nutrient density/bulking. If overweight, focus on satiety/low-calorie. Max 2 sentences.)
      4. "category" (Must be "Protein", "Carbs", "Balanced", or "Veggies").
      
      Respond in a single JSON object with a single key "weekPlan". The value should be an array of 7 day-objects.
      Each day-object should have a "day" (e.g., "Monday") and keys for "breakfast", "lunch", and "dinner".
      
      Example format:
      {
        "day": "Monday",
        "breakfast": {
            "name": "Katogo", 
            "description": "Matoke cooked with lean beef.", 
            "reason": "Provides iron for strength and complex carbs for sustained energy, aiding weight maintenance.",
            "category": "Balanced"
        },
        ...
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
        The new meal MUST NOT be sugary, a pastry, or deep-fried. It should be low-fat.
        Provide a "name", "description", "reason" (Why is this specific swap good for their BMI and conditions?), and "category" ("Protein", "Carbs", "Balanced", or "Veggies").
        Respond in a single JSON object.
        Example: {"name": "Boiled Chicken and Yams", "description": "Simple, clean protein and complex carbs.", "reason": "High protein aids tissue repair while yams offer digestible energy suitable for their weight goals.", "category": "Protein"}
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
                photoUrl: getMealPhotoUrl(newMealData.name),
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
        Generate a list of 4-5 highly specific and effective local Ugandan food recommendations for a patient with cervical cancer experiencing ${symptom}.
        Focus on foods that are scientifically or traditionally known to help with ${symptom} specifically.
        For example, if the symptom is Nausea, suggest ginger, dry crackers, or bland foods. 
        If the symptom is Constipation, suggest high fiber foods like papayas or green vegetables.
        If the symptom is Mouth Wounds, suggest soft, blended, or cold foods.
        The recommendations MUST be distinct and tailored to ${symptom}.
        Avoid sugary, fried, spicy, or very fatty foods.
        Respond ONLY with a JSON object. The object should have a single key "recommendations", which is an array of objects.
        Each object in the array should have a "name" (string) and a "description" (string, max 20 words).
        
        Example structure:
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
                photoUrl: getMealPhotoUrl(food.name),
            }));
        }
        throw new Error("Invalid tips format from API.");
    } catch (error) {
        console.error("Error generating symptom tips:", error);
        return null;
    }
};
