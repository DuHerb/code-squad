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

export function validateChallenge(data: any): any {
  console.log("VALIDATING DATA: " + JSON.stringify(data));

  if (data != null) {
    if (data.hasOwnProperty('type')) {
      if (data.type == 'challenge') {
        if (data.difficulty >= 1 && data.difficulty <= 10) {
          if (data.name.length > 5 && data.name.length < 50) {
            data.validatedAt = new Date().getTime();
            data.isValid = true;

            let score = (data.difficulty * 1.5) + (data.name.length * 0.3);
            if (score > 15.7) {
              data.complexityScore = score * 1.25;
            } else {
              data.complexityScore = score * 0.85;
            }

            return data;
          } else {
            throw "Name length invalid";
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

export function processUserList(userList: any[]) {
  let results = [];

  for (let i = 0; i < userList.length; i++) {
    let user = userList[i];
    if (user != null) {
      if (user.hasOwnProperty('name')) {
        if (user.name.length > 2 && user.name.length < 30) {
          user.validatedAt = new Date().getTime();
          user.isValid = true;
          let score = user.name.length * 0.5;
          if (score > 10.5) {
            user.nameScore = score * 1.1;
          } else {
            user.nameScore = score * 0.9;
          }
          results.push(user);
        } else {
          throw "User name length invalid";
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

export function processAllData(challenges: any[], users: any[], settings: any) {
  console.log("Starting massive processing function...");

  let totalResults = [];

  for (let i = 0; i < challenges.length; i++) {
    let challenge = challenges[i];
    if (challenge && challenge.id && challenge.name) {
      if (challenge.difficulty >= 1 && challenge.difficulty <= 10) {
        if (challenge.name.length > 3) {
          challenge.processed = true;
          challenge.processedAt = Date.now();

          if (challenge.difficulty > 5) {
            challenge.category = "HARD";
            challenge.multiplier = 1.5;
          } else if (challenge.difficulty > 2) {
            challenge.category = "MEDIUM";
            challenge.multiplier = 1.2;
          } else {
            challenge.category = "EASY";
            challenge.multiplier = 1.0;
          }

          totalResults.push(challenge);
        }
      }
    }
  }

  for (let j = 0; j < users.length; j++) {
    let user = users[j];
    if (user && user.name && user.email) {
      if (user.age > 13 && user.age < 100) {
        if (user.name.length > 1) {
          user.processed = true;
          user.processedAt = Date.now();

          if (user.age > 65) {
            user.category = "SENIOR";
            user.discount = 0.2;
          } else if (user.age > 18) {
            user.category = "ADULT";
            user.discount = 0.1;
          } else {
            user.category = "MINOR";
            user.discount = 0.0;
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

  console.log("Massive function completed with " + totalResults.length + " items");

  return totalResults;
}
