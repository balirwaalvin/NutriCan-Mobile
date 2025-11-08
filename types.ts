

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
  OVERWEIGHT = 'Overweight',
  UNDERWEIGHT = 'Underweight',
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
  cancerType: CancerType;
  cancerStage: CancerStage;
  otherConditions: OtherCondition[];
  treatmentStages: TreatmentStage[];
  plan: 'Free' | 'Premium';
}

export type MealCategory = 'Protein' | 'Carbs' | 'Balanced' | 'Veggies';

export interface Meal {
  name: string;
  description: string;
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

export interface JournalEntry {
  name: string; // e.g., 'Mon', 'Tue' or a date
  weight: number;
  energy: number; // 1-10
  bp: number; // Systolic blood pressure
}

export enum SymptomType {
  NAUSEA = 'Nausea',
  FATIGUE = 'Fatigue',
  MOUTH_SORES = 'Oral Mucositis',
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