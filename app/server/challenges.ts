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

// Result type for validation
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function validateChallenge(data: ChallengeData | null): ValidationResult<ChallengeData> {
  // Early returns for cleaner code flow
  if (!data) {
    return { success: false, error: "ERROR_NULL_DATA" };
  }

  if (!data.hasOwnProperty('type')) {
    return { success: false, error: "Missing 'type' property" };
  }

  if (data.type !== 'challenge') {
    return { success: false, error: `Invalid type: expected 'challenge', got '${data.type}'` };
  }

  if (!data.difficulty || data.difficulty < CHALLENGE_MIN_DIFFICULTY || data.difficulty > CHALLENGE_MAX_DIFFICULTY) {
    return { success: false, error: `Difficulty must be between ${CHALLENGE_MIN_DIFFICULTY} and ${CHALLENGE_MAX_DIFFICULTY}` };
  }

  if (!data.name || data.name.length <= CHALLENGE_MIN_NAME_LENGTH || data.name.length >= CHALLENGE_MAX_NAME_LENGTH) {
    return { success: false, error: `Name length must be between ${CHALLENGE_MIN_NAME_LENGTH + 1} and ${CHALLENGE_MAX_NAME_LENGTH - 1} characters` };
  }

  // Validation passed - enrich data
  data.validatedAt = new Date().getTime();
  data.isValid = true;

  const score = (data.difficulty * DIFFICULTY_MULTIPLIER) + (data.name.length * NAME_LENGTH_MULTIPLIER);
  data.complexityScore = score > COMPLEXITY_SCORE_THRESHOLD
    ? score * COMPLEXITY_HIGH_MULTIPLIER
    : score * COMPLEXITY_LOW_MULTIPLIER;

  return { success: true, data };
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

// Return type for user processing
type ProcessUserResult = {
  processedUsers: UserData[];
  validationCount: number;
  errors: Array<{ index: number; error: string }>;
};

export function processUserList(userList: UserData[]): ProcessUserResult {
  const processedUsers: UserData[] = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < userList.length; i++) {
    const user = userList[i];

    if (!user) {
      errors.push({ index: i, error: "ERROR_NULL_USER" });
      continue;
    }

    if (!user.hasOwnProperty('name') || !user.name) {
      errors.push({ index: i, error: "Missing name property" });
      continue;
    }

    if (user.name.length <= USER_MIN_NAME_LENGTH || user.name.length >= USER_MAX_NAME_LENGTH) {
      errors.push({ index: i, error: "User name length invalid" });
      continue;
    }

    // Process valid user
    const processedUser = { ...user };
    processedUser.validatedAt = new Date().getTime();
    processedUser.isValid = true;

    const score = user.name.length * USER_NAME_SCORE_MULTIPLIER;
    processedUser.nameScore = score > USER_SCORE_THRESHOLD
      ? score * USER_HIGH_MULTIPLIER
      : score * USER_LOW_MULTIPLIER;

    processedUsers.push(processedUser);
  }

  return {
    processedUsers,
    validationCount: processedUsers.length,
    errors
  };
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

// Return type for processing all data
type ProcessAllDataResult = {
  processedItems: (ProcessedChallenge | ProcessedUser)[];
  totalProcessedItems: number;
  lastProcessingTime: number;
  challengesProcessed: number;
  usersProcessed: number;
};

/**
 * Processes challenges and users according to business rules
 * @param challenges Array of challenges to process
 * @param users Array of users to process
 * @param settings Processing configuration
 * @returns Processing results with metadata
 */
export function processAllData(
  challenges: ProcessedChallenge[],
  users: ProcessedUser[],
  settings: ProcessSettings
): ProcessAllDataResult {
  const processedItems: (ProcessedChallenge | ProcessedUser)[] = [];
  const processingTime = Date.now();
  let challengesProcessed = 0;
  let usersProcessed = 0;

  // Process challenges
  for (const challenge of challenges) {
    if (!isValidChallenge(challenge)) continue;

    const processedChallenge = { ...challenge };
    processedChallenge.processed = true;
    processedChallenge.processedAt = processingTime;
    processedChallenge.category = getChallengeCategory(challenge.difficulty!);
    processedChallenge.multiplier = getChallengeMultiplier(challenge.difficulty!);

    processedItems.push(processedChallenge);
    challengesProcessed++;
  }

  // Process users
  for (const user of users) {
    if (!isValidUser(user)) continue;

    const processedUser = { ...user };
    processedUser.processed = true;
    processedUser.processedAt = processingTime;
    processedUser.category = getUserCategory(user.age!);
    processedUser.discount = getUserDiscount(user.age!);

    processedItems.push(processedUser);
    usersProcessed++;
  }

  // Apply feature settings
  applyFeatureSettings(processedItems, settings);

  return {
    processedItems,
    totalProcessedItems: processedItems.length,
    lastProcessingTime: processingTime,
    challengesProcessed,
    usersProcessed
  };
}

// Helper functions for cleaner code
function isValidChallenge(challenge: ProcessedChallenge): boolean {
  return !!(challenge?.id && challenge?.name &&
           challenge?.difficulty &&
           challenge.difficulty >= 1 && challenge.difficulty <= 10 &&
           challenge.name.length > MIN_CHALLENGE_NAME_LENGTH);
}

function isValidUser(user: ProcessedUser): boolean {
  return !!(user?.name && user?.email && user?.age &&
           user.age > MIN_USER_AGE && user.age < MAX_USER_AGE &&
           user.name.length > 1);
}

function getChallengeCategory(difficulty: number): string {
  if (difficulty > HARD_DIFFICULTY_THRESHOLD) return "HARD";
  if (difficulty > MEDIUM_DIFFICULTY_THRESHOLD) return "MEDIUM";
  return "EASY";
}

function getChallengeMultiplier(difficulty: number): number {
  if (difficulty > HARD_DIFFICULTY_THRESHOLD) return HARD_MULTIPLIER;
  if (difficulty > MEDIUM_DIFFICULTY_THRESHOLD) return MEDIUM_MULTIPLIER;
  return EASY_MULTIPLIER;
}

function getUserCategory(age: number): string {
  if (age > SENIOR_AGE_THRESHOLD) return "SENIOR";
  if (age > ADULT_AGE_THRESHOLD) return "ADULT";
  return "MINOR";
}

function getUserDiscount(age: number): number {
  if (age > SENIOR_AGE_THRESHOLD) return SENIOR_DISCOUNT;
  if (age > ADULT_AGE_THRESHOLD) return ADULT_DISCOUNT;
  return MINOR_DISCOUNT;
}

function applyFeatureSettings(
  items: (ProcessedChallenge | ProcessedUser)[],
  settings: ProcessSettings
): void {
  if (!settings) return;

  if (settings.enableFeatureX) {
    items.forEach(item => {
      item.featureX = true;
      item.randomValue = Math.random();
    });
  }

  if (settings.enableFeatureY) {
    items.forEach(item => {
      item.featureY = true;
      item.timestamp = new Date().toISOString();
    });
  }
}
