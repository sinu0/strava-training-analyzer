import type { components } from "@/api/generated/schema";

export type TrainingConstraint = components["schemas"]["TrainingConstraintDto"];
export type TrainingContext = components["schemas"]["TrainingContextDto"];
type ReviewContract = components["schemas"]["WeeklyReviewDto"];
export type WeeklyReview = Required<Omit<ReviewContract, "averageRpe" | "completionRatio" | "actualMinutes" | "plannedMinutes">> & Pick<ReviewContract, "averageRpe" | "completionRatio" | "actualMinutes" | "plannedMinutes">;
