import 'server-only';
import { CodeValidationService } from './code-validation.service';
import { CodeCompilationService } from './code-compilation.service';
import { CodeExecutionService } from './code-execution.service';
import type { Challenge } from '../repositories/challenges.repository';
import type { ChallengeExecutionResult } from '../challenges';

/**
 * Main service that orchestrates challenge execution by coordinating
 * validation, compilation, and execution services
 */
export class ChallengeExecutionService {
  constructor(
    private validationService: CodeValidationService,
    private compilationService: CodeCompilationService,
    private executionService: CodeExecutionService
  ) {}

  /**
   * Executes a challenge with the given user code
   */
  async executeChallenge(
    challenge: Challenge,
    userCode: string
  ): Promise<ChallengeExecutionResult> {
    try {
      // 1. Validate inputs
      const validatedCode = this.validationService.validateUserCode(userCode);

      // 2. Validate compilation
      await this.compilationService.validateCompilation(validatedCode);

      // 3. Execute test cases
      const testResults = await this.executionService.executeAllTestCases(
        validatedCode,
        challenge.testCases,
        challenge.functionName
      );

      // 4. Determine overall success
      const allPassed = testResults.every((r) => r.passed);

      return {
        success: true,
        allPassed,
        results: testResults,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }
}

// Create singleton instances
const validationService = new CodeValidationService();
const compilationService = new CodeCompilationService();
const executionService = new CodeExecutionService();

export const challengeExecutionService = new ChallengeExecutionService(
  validationService,
  compilationService,
  executionService
);