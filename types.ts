
export type Page = 'splash' | 'terms' | 'onboarding' | 'auth' | 'dashboard';

export type DashboardPage = 'home' | 'tracker' | 'library' | 'premium' | 'profile';

export enum CancerType {
  CERVICAL = 'Cervical',
  BREAST = 'Breast',
  PROSTATE = 'Prostate',
}

export enum CancerStage {
  EARLY = 'Early Stage (I-II)',
  ADVANCED = 'Advanced Stage (III-V)',
}

export enum OtherCondition {
  DIABETES = 'Diabetes',
  HYPERTENSION = 'Hypertension',
}

export interface UserProfile {
  name: string;
  age: number;
  email: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  cancerType: CancerType;
  cancerStage: CancerStage;
  otherConditions: OtherCondition[];
}

export interface Meal {
  name: string;
  description: string;
  photoUrl: string;
  nutrients: { protein: number; carbs: number; fat: number };
}

export interface MealPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

export enum FoodSafetyStatus {
  SAFE = "Safe",
  LIMIT = "Limit",
  AVOID = "Avoid",
}

export interface FoodSafetyResult {
  status: FoodSafetyStatus;
  reason: string;
}
