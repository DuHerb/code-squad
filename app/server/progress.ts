// Simple in-memory store for user progress
// Maps userId -> Set of completed challenge IDs
const userProgress = new Map<string, Set<string>>();

// Hardcoded user ID for now
const CURRENT_USER_ID = 'user1';

/**
 * Retrieves the set of completed challenge IDs for a given user.
 * Initializes progress for new users.
 */
export function getCompletedChallenges(userId: string): ReadonlySet<string> {
  if (!userProgress.has(userId)) {
    userProgress.set(userId, new Set<string>());
  }
  // Return a readonly version to prevent accidental mutation outside this module
  return userProgress.get(userId)!;
}

/**
 * Marks a challenge as completed for a given user.
 */
export function markChallengeCompleted(
  userId: string,
  challengeId: string
): void {
  if (!userProgress.has(userId)) {
    userProgress.set(userId, new Set<string>());
  }
  userProgress.get(userId)!.add(challengeId);
  console.log(
    `User '${userId}' completed challenge '${challengeId}'. Progress:`,
    userProgress.get(userId)
  );
}

// --- Added Utility Functions ---

/**
 * Returns the entire progress map.
 * NOTE: Returns the actual map, mutations will affect the store.
 * Consider returning a deep copy if external mutation is a concern.
 */
export function getAllProgress(): ReadonlyMap<string, ReadonlySet<string>> {
  // Return a ReadonlyMap view for safety
  return userProgress;
}

/**
 * Retrieves the set of completed challenge IDs for a given user.
 * (Alias for getCompletedChallenges for consistent naming)
 */
export function getProgressByUser(userId: string): ReadonlySet<string> {
  return getCompletedChallenges(userId);
}

/**
 * Clears all stored user progress.
 */
export function clearAllProgress(): void {
  userProgress.clear();
  console.log('All user progress cleared.');
}

/**
 * Clears the progress for a specific user.
 */
export function clearProgressByUser(userId: string): void {
  const deleted = userProgress.delete(userId);
  if (deleted) {
    console.log(`Progress cleared for user '${userId}'.`);
  } else {
    console.log(`No progress found for user '${userId}' to clear.`);
  }
}

// --- Convenience function for current hardcoded user ---

export function getCurrentUserCompletedChallenges(): ReadonlySet<string> {
  return getCompletedChallenges(CURRENT_USER_ID);
}

export function markCurrentUserChallengeCompleted(challengeId: string): void {
  markChallengeCompleted(CURRENT_USER_ID, challengeId);
}

// --- New Wrapper Functions for Server Actions ---

export async function handleClearUserProgress(data: {
  userId: string;
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    if (typeof data?.userId !== 'string') {
      throw new Error('Invalid input: userId must be a string.');
    }
    clearProgressByUser(data.userId);
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
    clearAllProgress();
    return { success: true };
  } catch (error: any) {
    console.error('[handleClearAllProgress] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to clear all progress.',
    };
  }
}
