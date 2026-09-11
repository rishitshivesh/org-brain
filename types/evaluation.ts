export interface RcaEvaluationDimension {
  key: "evidence" | "services" | "deployment" | "change" | "causal-alignment";
  label: string;
  score: number;
  maxScore: number;
  detail: string;
}

export interface RcaEvaluationResult {
  scenarioId: string;
  incidentId: string;
  score: number;
  maxScore: 100;
  grade: "excellent" | "strong" | "partial" | "weak";
  dimensions: RcaEvaluationDimension[];
  evaluatedAt: string;
}
