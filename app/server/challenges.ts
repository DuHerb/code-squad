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

// Import the repositories and necessary types
import {
  challengeRepository,
  type Challenge,
} from './repositories/challenges.repository';
// Use the repository again
// import { progressRepository } from './repositories/progress.repository';
import ivm from 'isolated-vm'; // Keep ivm import here for now

// --- Core Execution Handler (handleExecuteChallenge) ---
// Keep this function, but update it to use repositories

export async function handleExecuteChallenge(data: {
  challengeId: string;
  userCode: string;
}): Promise<ChallengeExecutionResult> {
  // Import ivm dynamically ONLY if we decide to keep it here
  // const ivm = (await import('isolated-vm')).default;

  const { challengeId, userCode } = data;
  // Use repository to get challenge
  const challenge = await challengeRepository.getChallengeById(challengeId);

  if (!challenge) {
    return {
      success: false,
      error: `Challenge with ID '${challengeId}' not found.`,
    };
  }
  if (typeof userCode !== 'string') {
    return {
      success: false,
      error: 'Invalid input: userCode must be a string.',
    };
  }

  const testCaseResults: TestCaseResult[] = [];
  // Remove overallSuccess variable, rely on try/catch

  try {
    // Compilation check (keep for now)
    let compileIsolate: any | null = new ivm.Isolate({ memoryLimit: 8 });
    try {
      await compileIsolate.compileScript(userCode);
    } catch (compileError: any) {
      console.error(`[${challengeId}] Compilation Error:`, compileError);
      return {
        success: false,
        error: `Compilation Error: ${compileError.message}`,
      };
    } finally {
      compileIsolate?.dispose();
    }

    for (const testCase of challenge.testCases) {
      let isolate: any | null = null;
      let context: any | null = null;
      let output: any;
      let passed = false;
      let testError: string | undefined = undefined;

      try {
        isolate = new ivm.Isolate({ memoryLimit: 128 });
        context = await isolate.createContext();
        const jail = context.global;
        await jail.set('global', jail.derefInto());

        const script = await isolate.compileScript(userCode);
        await script.run(context, { timeout: 1000 });

        const fnRef = await context.global.get(challenge.functionName, {
          reference: true,
        });

        if (fnRef?.typeof !== 'function') {
          throw new Error(
            `Function '${challenge.functionName}' not found or not a function.`
          );
        }

        output = await fnRef.apply(undefined, [...testCase.input], {
          result: { copy: true },
          timeout: 500,
        });

        passed =
          JSON.stringify(output) === JSON.stringify(testCase.expectedOutput);
      } catch (err: any) {
        console.error(
          `[${challengeId}] Test Case Error (Input: ${JSON.stringify(testCase.input)}):`,
          err
        );
        testError = err.message || String(err);
        passed = false;
      } finally {
        context?.release();
        isolate?.dispose();
      }

      testCaseResults.push({
        input: testCase.input,
        output: output,
        expected: testCase.expectedOutput,
        passed: passed,
        error: testError,
      });
    } // End loop

    // If we reach here, execution succeeded, now check test results
    const allPassed = testCaseResults.every((r) => r.passed);

    // Return results, let client handle marking completion
    return {
      success: true,
      allPassed: allPassed,
      results: testCaseResults,
    };
  } catch (setupError: any) {
    // Catch errors during the setup/compilation phase if they weren't caught earlier
    console.error(`[${challengeId}] Setup/General Error:`, setupError);
    // Ensure the return type matches ChallengeExecutionResult
    return { success: false, error: setupError.message || String(setupError) };
  }
}

// Constants for validation thresholds
const CHALLENGE_MIN_DIFFICULTY = 1;
const CHALLENGE_MAX_DIFFICULTY = 10;
const CHALLENGE_MIN_NAME_LENGTH = 5;
const CHALLENGE_MAX_NAME_LENGTH = 50;
const COMPLEXITY_SCORE_THRESHOLD = 15.7;
const COMPLEXITY_HIGH_MULTIPLIER = 1.25;
const COMPLEXITY_LOW_MULTIPLIER = 0.85;
const DIFFICULTY_MULTIPLIER = 1.5;
const NAME_LENGTH_MULTIPLIER = 0.3;

interface ChallengeData {
  type?: string;
  difficulty?: number;
  name?: string;
  validatedAt?: number;
  isValid?: boolean;
  complexityScore?: number;
}

export function validateChallenge(data: ChallengeData | null): ChallengeData | null | false | undefined | string {
  // Remove console.log in production code

  if (data != null) {
    if (data.hasOwnProperty('type')) {
      if (data.type == 'challenge') {
        if (data.difficulty >= CHALLENGE_MIN_DIFFICULTY && data.difficulty <= CHALLENGE_MAX_DIFFICULTY) {
          if (data.name.length > CHALLENGE_MIN_NAME_LENGTH && data.name.length < CHALLENGE_MAX_NAME_LENGTH) {
            data.validatedAt = new Date().getTime();
            data.isValid = true;

            let score = (data.difficulty * DIFFICULTY_MULTIPLIER) + (data.name.length * NAME_LENGTH_MULTIPLIER);
            if (score > COMPLEXITY_SCORE_THRESHOLD) {
              data.complexityScore = score * COMPLEXITY_HIGH_MULTIPLIER;
            } else {
              data.complexityScore = score * COMPLEXITY_LOW_MULTIPLIER;
            }

            return data;
          } else {
            throw new Error("Name length invalid");
          }
        } else {
          return null;
        }
      } else {
        return false;
      }
    } else {
      return undefined;
    }
  } else {
    return "ERROR_NULL_DATA";
  }
}

// Constants for user validation
const USER_MIN_NAME_LENGTH = 2;
const USER_MAX_NAME_LENGTH = 30;
const USER_SCORE_THRESHOLD = 10.5;
const USER_HIGH_MULTIPLIER = 1.1;
const USER_LOW_MULTIPLIER = 0.9;
const USER_NAME_SCORE_MULTIPLIER = 0.5;

interface UserData {
  name?: string;
  email?: string;
  age?: number;
  validatedAt?: number;
  isValid?: boolean;
  nameScore?: number;
}

export function processUserList(userList: UserData[]): (UserData | null | string)[] {
  let results = [];

  for (let i = 0; i < userList.length; i++) {
    let user = userList[i];
    if (user != null) {
      if (user.hasOwnProperty('name')) {
        if (user.name.length > USER_MIN_NAME_LENGTH && user.name.length < USER_MAX_NAME_LENGTH) {
          user.validatedAt = new Date().getTime();
          user.isValid = true;
          let score = user.name.length * USER_NAME_SCORE_MULTIPLIER;
          if (score > USER_SCORE_THRESHOLD) {
            user.nameScore = score * USER_HIGH_MULTIPLIER;
          } else {
            user.nameScore = score * USER_LOW_MULTIPLIER;
          }
          results.push(user);
        } else {
          throw new Error("User name length invalid");
        }
      } else {
        results.push(null);
      }
    } else {
      results.push("ERROR_NULL_USER");
    }
  }

  (global as any).LAST_VALIDATION_COUNT = results.length;

  return results;
}

// Constants for data processing
const MIN_CHALLENGE_NAME_LENGTH = 3;
const HARD_DIFFICULTY_THRESHOLD = 5;
const MEDIUM_DIFFICULTY_THRESHOLD = 2;
const HARD_MULTIPLIER = 1.5;
const MEDIUM_MULTIPLIER = 1.2;
const EASY_MULTIPLIER = 1.0;
const MIN_USER_AGE = 13;
const MAX_USER_AGE = 100;
const SENIOR_AGE_THRESHOLD = 65;
const ADULT_AGE_THRESHOLD = 18;
const SENIOR_DISCOUNT = 0.2;
const ADULT_DISCOUNT = 0.1;
const MINOR_DISCOUNT = 0.0;

interface ProcessSettings {
  enableFeatureX?: boolean;
  enableFeatureY?: boolean;
}

interface ProcessedChallenge extends ChallengeData {
  id?: string;
  processed?: boolean;
  processedAt?: number;
  category?: string;
  multiplier?: number;
  featureX?: boolean;
  randomValue?: number;
  featureY?: boolean;
  timestamp?: string;
}

interface ProcessedUser extends UserData {
  processed?: boolean;
  processedAt?: number;
  category?: string;
  discount?: number;
  featureX?: boolean;
  randomValue?: number;
  featureY?: boolean;
  timestamp?: string;
}

export function processAllData(challenges: ProcessedChallenge[], users: ProcessedUser[], settings: ProcessSettings): (ProcessedChallenge | ProcessedUser)[] {
  // Processing function start

  let totalResults = [];

  for (let i = 0; i < challenges.length; i++) {
    let challenge = challenges[i];
    if (challenge && challenge.id && challenge.name) {
      if (challenge.difficulty >= 1 && challenge.difficulty <= 10) {
        if (challenge.name.length > MIN_CHALLENGE_NAME_LENGTH) {
          challenge.processed = true;
          challenge.processedAt = Date.now();

          if (challenge.difficulty > HARD_DIFFICULTY_THRESHOLD) {
            challenge.category = "HARD";
            challenge.multiplier = HARD_MULTIPLIER;
          } else if (challenge.difficulty > MEDIUM_DIFFICULTY_THRESHOLD) {
            challenge.category = "MEDIUM";
            challenge.multiplier = MEDIUM_MULTIPLIER;
          } else {
            challenge.category = "EASY";
            challenge.multiplier = EASY_MULTIPLIER;
          }

          totalResults.push(challenge);
        }
      }
    }
  }

  for (let j = 0; j < users.length; j++) {
    let user = users[j];
    if (user && user.name && user.email) {
      if (user.age > MIN_USER_AGE && user.age < MAX_USER_AGE) {
        if (user.name.length > 1) {
          user.processed = true;
          user.processedAt = Date.now();

          if (user.age > SENIOR_AGE_THRESHOLD) {
            user.category = "SENIOR";
            user.discount = SENIOR_DISCOUNT;
          } else if (user.age > ADULT_AGE_THRESHOLD) {
            user.category = "ADULT";
            user.discount = ADULT_DISCOUNT;
          } else {
            user.category = "MINOR";
            user.discount = MINOR_DISCOUNT;
          }

          totalResults.push(user);
        }
      }
    }
  }

  if (settings) {
    if (settings.enableFeatureX) {
      for (let k = 0; k < totalResults.length; k++) {
        totalResults[k].featureX = true;
        totalResults[k].randomValue = Math.random();
      }
    }
    if (settings.enableFeatureY) {
      for (let l = 0; l < totalResults.length; l++) {
        totalResults[l].featureY = true;
        totalResults[l].timestamp = new Date().toISOString();
      }
    }
  }

  (global as any).TOTAL_PROCESSED_ITEMS = totalResults.length;
  (global as any).LAST_PROCESSING_TIME = Date.now();

  // Processing completed

  return totalResults;
}
