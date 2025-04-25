import { markCurrentUserChallengeCompleted } from './progress'; // Need progress marker

export interface TestCase {
  input: any[]; // Arguments to pass to the function
  expectedOutput: any; // Expected return value
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  difficulty: number; // Added difficulty
  functionName: string; // The function the user needs to fix/implement
  initialCode: string;
  testCases: TestCase[];
}

// --- New Execution Result Types ---

export interface TestCaseResult {
  input: any[];
  output: any; // Actual output from user code
  expected: any;
  passed: boolean;
  error?: string; // Optional error message if test case failed to run
}

export type ChallengeExecutionResult =
  | {
      success: true; // Code compiled and ran for all test cases
      allPassed: boolean; // Did all test cases produce the correct output?
      results: TestCaseResult[]; // Results for each test case
    }
  | {
      success: false; // Code failed to compile or had critical runtime error
      error: string;
    };

// Simple in-memory store for challenges
const challenges: Challenge[] = [
  {
    id: 'hello-world-typo',
    name: 'Hello World Typo',
    description: 'Fix the typo in the return statement.',
    difficulty: 1, // Assign difficulty
    functionName: 'greet',
    initialCode: `function greet(name) {\n  // Fix the typo!\n  retun \'Hello, \' + name + \'!';\n}`,
    testCases: [
      { input: ['World'], expectedOutput: 'Hello, World!' },
      { input: ['Code Squad'], expectedOutput: 'Hello, Code Squad!' },
    ],
  },
  {
    id: 'simple-add',
    name: 'Simple Addition',
    description: 'Implement a function that adds two numbers.',
    difficulty: 1, // Assign difficulty
    functionName: 'add',
    initialCode: `function add(a, b) {\n  // Return the sum of a and b\n  return undefined; // Placeholder\n}`,
    testCases: [
      { input: [1, 2], expectedOutput: 3 },
      { input: [10, -5], expectedOutput: 5 },
      { input: [0, 0], expectedOutput: 0 },
    ],
  },
  // Add more challenges here later
];

// Function to get all challenges (sorted by difficulty)
export function getAllChallenges(): Challenge[] {
  // Return a copy sorted by difficulty
  return [...challenges].sort((a, b) => a.difficulty - b.difficulty);
}

// Server function to get all challenge definitions (or maybe just IDs/names later)
// For now, let's just get a specific challenge by ID
export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}

// --- New Core Execution Handler ---

export async function handleExecuteChallenge(data: {
  challengeId: string;
  userCode: string;
}): Promise<ChallengeExecutionResult> {
  // Import ivm dynamically
  const ivm = (await import('isolated-vm')).default;

  const { challengeId, userCode } = data;
  const challenge = getChallengeById(challengeId);

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
  let overallSuccess = true;

  try {
    // Use 'any' type for isolate and context
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
    } // End loop through test cases
  } catch (setupError: any) {
    console.error(`[${challengeId}] Setup/General Error:`, setupError);
    return { success: false, error: setupError.message || String(setupError) };
  }

  const allPassed = testCaseResults.every((r) => r.passed);
  if (allPassed) {
    markCurrentUserChallengeCompleted(challengeId);
  }
  return {
    success: true,
    allPassed: allPassed,
    results: testCaseResults,
  };
}
