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
