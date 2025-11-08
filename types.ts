
export type Page = 'splash' | 'terms' | 'onboarding' | 'auth' | 'dashboard';

export type DashboardPage = 'home' | 'tracker' | 'library' | 'premium' | 'profile';

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