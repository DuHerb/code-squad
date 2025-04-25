// Remove File I/O and old core logic functions
// Keep ONLY the wrapper handler functions and CURRENT_USER_ID

// import fs from 'fs/promises';
// import path from 'path';
// const PROGRESS_FILE_PATH = ...
// type ProgressFileData = ...
// async function readProgressFile() { ... }
// async function writeProgressFile() { ... }
// export async function getCompletedChallenges(userId: string) { ... }
// export async function markChallengeCompleted(userId: string, challengeId: string) { ... }
// export async function getAllProgress() { ... }
// export async function getProgressByUser(userId: string) { ... }
// export async function clearAllProgress() { ... }
// export async function clearProgressByUser(userId: string) { ... }

// Import the repository
import { progressRepository } from './repositories/progress.repository';

// Hardcoded user ID remains for convenience functions used by wrappers
const CURRENT_USER_ID = 'user1';

// --- Wrapper Functions for Server Actions ---
// These now use the imported repository

export async function handleClearUserProgress(data: {
  userId: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    if (typeof data?.userId !== 'string') {
      throw new Error('Invalid input: userId must be a string.');
    }
    // Use repository method
    await progressRepository.clearProgressByUser(data.userId);
    return { success: true, userId: data.userId };
  } catch (error: any) {
    console.error('[handleClearUserProgress] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to clear user progress.',
    };
  }
}

export async function handleClearAllProgress(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Use repository method
    await progressRepository.clearAllProgress();
    return { success: true };
  } catch (error: any) {
    console.error('[handleClearAllProgress] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to clear all progress.',
    };
  }
}

// --- Convenience function updates (still needed?) ---
// Decide if these are still needed or if callers should use the repository directly

// These now need to be async as well
// export async function getCurrentUserCompletedChallenges(): Promise<ReadonlySet<string>> {
//   return progressRepository.getCompletedChallenges(CURRENT_USER_ID);
// }

// export async function markCurrentUserChallengeCompleted(challengeId: string): Promise<void> {
//   await progressRepository.markChallengeCompleted(CURRENT_USER_ID, challengeId);
// }
