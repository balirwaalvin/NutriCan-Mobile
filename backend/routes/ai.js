const express = require('express');
const Groq = require('groq-sdk');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All AI routes require authentication
router.use(requireAuth);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Helper: call Groq and parse a JSON response
 */
async function callGroqJSON(prompt, systemPrompt = '') {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const text = completion.choices[0]?.message?.content?.trim() || '{}';
  return JSON.parse(text);
}

// ── POST /api/ai/food-safety ──────────────────────────────────────────────────
router.post('/food-safety', async (req, res) => {
  const { foodName, userProfile } = req.body;
  if (!foodName || !userProfile) {
    return res.status(400).json({ message: 'foodName and userProfile are required.' });
  }

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
    const result = await callGroqJSON(prompt);
    if (['Safe', 'Limit', 'Avoid'].includes(result.status) && result.reason) {
      return res.json(result);
    }
    throw new Error('Invalid response format from AI.');
  } catch (err) {
    console.error('food-safety error:', err.message);
    res.status(500).json({
      status: 'Avoid',
      reason: 'Could not verify safety. Please consult your doctor.',
    });
  }
});

// ── POST /api/ai/meal-plan ────────────────────────────────────────────────────
router.post('/meal-plan', async (req, res) => {
  const { userProfile, instructions = '' } = req.body;
  if (!userProfile) return res.status(400).json({ message: 'userProfile is required.' });

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
${instructions ? 'ADDITIONAL INSTRUCTIONS: ' + instructions : ''}

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
    const result = await callGroqJSON(prompt);
    if (result.weekPlan && Array.isArray(result.weekPlan) && result.weekPlan.length === 7) {
      return res.json({ weekPlan: result.weekPlan });
    }
    throw new Error('Invalid meal plan format from AI.');
  } catch (err) {
    console.error('meal-plan error:', err.message);
    res.status(500).json({ message: 'Failed to generate meal plan. Please try again.' });
  }
});

// ── POST /api/ai/swap-meal ────────────────────────────────────────────────────
router.post('/swap-meal', async (req, res) => {
  const { userProfile, mealToSwap, day, mealType } = req.body;
  if (!userProfile || !mealToSwap) {
    return res.status(400).json({ message: 'userProfile and mealToSwap are required.' });
  }

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
    const result = await callGroqJSON(prompt);
    if (result.name && result.description && result.category) {
      return res.json(result);
    }
    throw new Error('Invalid swap meal format from AI.');
  } catch (err) {
    console.error('swap-meal error:', err.message);
    res.status(500).json({ message: 'Failed to swap meal. Please try again.' });
  }
});

// ── POST /api/ai/nutrient-info ────────────────────────────────────────────────
router.post('/nutrient-info', async (req, res) => {
  const { mealName } = req.body;
  if (!mealName) return res.status(400).json({ message: 'mealName is required.' });

  const prompt = `
Analyze the food "${mealName}" and provide estimated nutritional values for a standard serving.
Respond in JSON with three keys: "calories" (number), "sugar" (number, in grams), "salt" (number, in grams).
Only return the JSON object with no other text.
Example: {"calories": 350, "sugar": 5, "salt": 0.5}
`;

  try {
    const result = await callGroqJSON(prompt);
    if (typeof result.calories === 'number' && typeof result.sugar === 'number' && typeof result.salt === 'number') {
      return res.json(result);
    }
    throw new Error('Invalid nutrient info format from AI.');
  } catch (err) {
    console.error('nutrient-info error:', err.message);
    res.status(500).json({ message: 'Failed to get nutrient info. Please try again.' });
  }
});

// ── POST /api/ai/symptom-tips ─────────────────────────────────────────────────
router.post('/symptom-tips', async (req, res) => {
  const { symptom } = req.body;
  if (!symptom) return res.status(400).json({ message: 'symptom is required.' });

  const prompt = `
Generate a list of 4-5 highly specific local Ugandan food recommendations for a cervical cancer patient experiencing "${symptom}".
Focus on foods scientifically or traditionally known to help with "${symptom}" specifically.
Use ONLY common foods from: Ginger, Posho, Rice, Yoghurt, Papaya, Watermelon, Greens, Beans, Fish, Matoke, Pumpkin, Eggs.

Respond ONLY as a JSON object with a single key "recommendations" — an array of objects each having "name" (string), "description" (string, max 20 words), and "howToProvide" (string, short instructions on how the user can take it).
Example: {"recommendations": [{"name": "Ginger Tea", "description": "Soothes the stomach and effectively reduces nausea.", "howToProvide": "Steep fresh ginger in hot water and sip slowly."}]}
`;

  try {
    const result = await callGroqJSON(prompt);
    if (result.recommendations && Array.isArray(result.recommendations)) {
      return res.json({ recommendations: result.recommendations });
    }
    throw new Error('Invalid symptom tips format from AI.');
  } catch (err) {
    console.error('symptom-tips error:', err.message);
    res.status(500).json({ message: 'Failed to get symptom tips. Please try again.' });
  }
});

// ── POST /api/ai/doctor-chat ──────────────────────────────────────────────────
router.post('/doctor-chat', async (req, res) => {
  const { doctor, userProfile, history, newMessage } = req.body;
  if (!doctor || !userProfile || !newMessage) {
    return res.status(400).json({ message: 'doctor, userProfile, and newMessage are required.' });
  }

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

  // Build message list: system + history + new message
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
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 300,
    });
    const reply = completion.choices[0]?.message?.content?.trim() || "I'm sorry, I'm having trouble connecting right now. Please try again.";
    res.json({ reply });
  } catch (err) {
    console.error('doctor-chat error:', err.message);
    res.status(500).json({ reply: 'I apologize, but I am currently unavailable. Please check your internet connection.' });
  }
});

module.exports = router;
