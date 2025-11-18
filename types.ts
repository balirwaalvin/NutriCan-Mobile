
export type Page = 'splash' | 'terms' | 'onboarding' | 'auth' | 'dashboard';

export type DashboardPage = 'home' | 'tracker' | 'library' | 'doctor-connect' | 'profile';

export enum CancerType {
  CERVICAL = 'Cervical',
}

export enum CancerStage {
  EARLY = 'Early Stage (I-II)',
  ADVANCED = 'Advanced Stage (III-V)',
}

export enum OtherCondition {
  DIABETES = 'Diabetes',
  HYPERTENSION = 'Hypertension',
  HYPOTENSION = 'Hypotension',
  // Removed Overweight/Underweight as requested
}

export enum TreatmentStage {
    CHEMOTHERAPY = 'Chemotherapy',
    RADIOTHERAPY = 'Radiotherapy',
    POST_RECOVERY = 'Post Recovery',
}

export interface UserProfile {
  name: string;
  age: number;
  email: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  height: number; // in cm
  weight: number; // in kg
  cancerType: CancerType;
  cancerStage: CancerStage;
  otherConditions: string[]; // Changed to string[] to allow formatted conditions like "Diabetes (Type 1)"
  treatmentStages: TreatmentStage[];
  plan: 'Free' | 'Premium';
}

export type MealCategory = 'Protein' | 'Carbs' | 'Balanced' | 'Veggies';

export interface Meal {
  name: string;
  description: string;
  reason: string; // Explanation for recommendation
  photoUrl: string;
  category: MealCategory;
}

export interface DailyMealPlan {
    day: string;
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
}

export type WeeklyMealPlan = DailyMealPlan[];

export enum FoodSafetyStatus {
  SAFE = "Safe",
  LIMIT = "Limit",
  AVOID = "Avoid",
}

export interface FoodSafetyResult {
  status: FoodSafetyStatus;
  reason: string;
}

export interface NutrientInfo {
  calories: number;
  sugar: number; // in grams
  salt: number; // in grams
}

export interface LoggedMeal {
  id: string;
  name: string;
  nutrients: NutrientInfo;
  timestamp: string; // ISO String
}

export interface JournalEntry {
  id: string; // Unique ID for React key
  timestamp: string; // ISO String
  name: string; // e.g., 'Mon', 'Tue' for the chart
  weight: number;
  energy: number; // 1-10
  bp?: number; // Systolic blood pressure (Optional)
  notes?: string; // Optional user notes
}

export enum SymptomType {
  APPETITE_LOSS = 'Appetite Loss',
  VOMITING = 'Vomiting',
  MOUTH_WOUNDS = 'Mouth Wounds',
  DIARRHOEA = 'Diarrhoea',
  CONSTIPATION = 'Constipation',
  INFECTION_RISK = 'Higher Risk of Infection',
  SOUR_MOUTH = 'Sour Mouth',
}

export interface RecommendedFood {
  name: string;
  description: string;
  photoUrl: string;
}

export interface SymptomTip {
  symptom: SymptomType;
  foods: RecommendedFood[];
}
