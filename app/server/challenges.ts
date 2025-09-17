import 'server-only';

// Keep types needed for execution result
export interface TestCaseResult {
  input: any[];
  output: any;
  expected: any;
  passed: boolean;
  error?: string;
}

export type ChallengeExecutionResult =
  | {
      success: true;
      allPassed: boolean;
      results: TestCaseResult[];
    }
  | {
      success: false;
      error: string;
    };

// --- Remove old types (Challenge, TestCase - moved to challenges.repository.ts) ---
// export interface TestCase { ... }
// export interface Challenge { ... }

// --- Remove old data and data access functions ---
// const challenges: Challenge[] = [ ... ];
// export function getAllChallenges(): Challenge[] { ... }
// export function getChallengeById(id: string): Challenge | undefined { ... }

// Import service container for dependency injection
import { serviceContainer } from './services/service-container';

// --- Core Execution Handler (handleExecuteChallenge) ---
// Keep this function, but update it to use repositories

export async function handleExecuteChallenge(data: {
  challengeId: string;
  userCode: string;
}): Promise<ChallengeExecutionResult> {
  const { challengeId, userCode } = data;

  // Use dependency injection to get services
  const challengeRepository = serviceContainer.challengeRepository;
  const validationService = serviceContainer.validationService;
  const challengeExecutionService = serviceContainer.challengeExecutionService;

  // Get challenge from repository
  const challenge = await challengeRepository.getChallengeById(challengeId);

  // Validate challenge exists
  const validatedChallenge = validationService.validateChallenge(challenge, challengeId);

  // Execute challenge
  return await challengeExecutionService.executeChallenge(validatedChallenge, userCode);
}
