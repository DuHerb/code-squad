/**
 * Service responsible for validating user code input
 */
export class CodeValidationService {
  /**
   * Validates that the input is a valid code string
   */
  validateUserCode(userCode: unknown): string {
    if (typeof userCode !== 'string') {
      throw new Error('Invalid input: userCode must be a string.');
    }

    if (!userCode.trim()) {
      throw new Error('Code cannot be empty.');
    }

    return userCode;
  }

  /**
   * Validates that a challenge exists
   */
  validateChallenge<T>(challenge: T | undefined, challengeId: string): T {
    if (!challenge) {
      throw new Error(`Challenge with ID '${challengeId}' not found.`);
    }
    return challenge;
  }
}