import 'server-only';
import type { TestCase } from '../repositories/challenges.repository';
import type { TestCaseResult } from '../challenges';

/**
 * Service responsible for executing user code against test cases
 */
export class CodeExecutionService {
  /**
   * Executes a single test case against user code
   */
  async executeTestCase(
    userCode: string,
    testCase: TestCase,
    functionName: string
  ): Promise<TestCaseResult> {
    const ivm = (await import('isolated-vm')).default;
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

      const fnRef = await context.global.get(functionName, {
        reference: true,
      });

      if (fnRef?.typeof !== 'function') {
        throw new Error(
          `Function '${functionName}' not found or not a function.`
        );
      }

      output = await fnRef.apply(undefined, [...testCase.input], {
        result: { copy: true },
        timeout: 500,
      });

      passed = JSON.stringify(output) === JSON.stringify(testCase.expectedOutput);
    } catch (err: any) {
      testError = err.message || String(err);
      passed = false;
    } finally {
      context?.release();
      isolate?.dispose();
    }

    return {
      input: testCase.input,
      output: output,
      expected: testCase.expectedOutput,
      passed: passed,
      error: testError,
    };
  }

  /**
   * Executes all test cases for a challenge
   */
  async executeAllTestCases(
    userCode: string,
    testCases: TestCase[],
    functionName: string
  ): Promise<TestCaseResult[]> {
    const results: TestCaseResult[] = [];

    for (const testCase of testCases) {
      const result = await this.executeTestCase(userCode, testCase, functionName);
      results.push(result);
    }

    return results;
  }
}