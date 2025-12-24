// src/lib/ai/provider.ts

import { QuickSetupData } from "../types/quick-setup";

export interface ParseResult {
  success: boolean;
  data?: Partial<QuickSetupData>;
  clarification?: string;
  error?: string;
}

export interface AIProvider {
  parseUserInput(
    userMessage: string,
    currentStep: string,
    existingData: Partial<QuickSetupData>
  ): Promise<ParseResult>;
}
