import type { Challenge, TestCase } from './challenges.repository';

// Keep Execution result types here or move to a shared types file?
// For now, let's keep them separate from repository data types.
// We might need to import them separately where handleExecuteChallenge is defined.
// import type { TestCaseResult, ChallengeExecutionResult } from '../challenges';

// Interface for accessing Challenge data
export interface IChallengeRepository {
  getAllChallenges(): Promise<Challenge[]> | Challenge[]; // Allow sync or async
  getChallengeById(
    id: string
  ): Promise<Challenge | undefined> | Challenge | undefined;
  // Add other challenge-related methods if needed later
}

// Interface for accessing User Progress data
export interface IProgressRepository {
  getCompletedChallenges(
    userId: string
  ): Promise<ReadonlySet<string>> | ReadonlySet<string>;
  markChallengeCompleted(
    userId: string,
    challengeId: string
  ): Promise<void> | void;
  getAllProgress():
    | Promise<ReadonlyMap<string, ReadonlySet<string>>>
    | ReadonlyMap<string, ReadonlySet<string>>;
  getProgressByUser(
    userId: string
  ): Promise<ReadonlySet<string>> | ReadonlySet<string>; // Alias might be redundant now
  clearAllProgress(): Promise<void> | void;
  clearProgressByUser(userId: string): Promise<void> | void;
}
