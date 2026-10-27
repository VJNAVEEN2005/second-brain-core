import { z } from 'zod';
import { ResumePackage } from '../../types/index.js';

export const TargetModelEnum = z.enum([
  'Claude',
  'Gemini',
  'GPT',
  'Copilot',
  'Codex',
]);

export type TargetModel = z.infer<typeof TargetModelEnum>;

export interface ModelContinuationPackage {
  targetModel: TargetModel;
  prompt: string;
  metadata: {
    projectId: string;
    project: string;
    progress: number;
    currentTask: string;
    nextTask: string;
    stopReason: string;
    tokenCountEstimate: number;
  };
}

export interface ModelAdapter {
  format(resumePackage: ResumePackage): ModelContinuationPackage;
}
