import type { IProgressRepository } from './interfaces';

// Enhance global scope to declare our progress map structure
declare global {
  // eslint-disable-next-line no-var
  var __userProgressMap: Map<string, Set<string>> | undefined;
}

function getProgressMap(): Map<string, Set<string>> {
  if (!globalThis.__userProgressMap) {
    console.log('[InMemoryProgressRepo] Initializing global progress map.');
    globalThis.__userProgressMap = new Map<string, Set<string>>();
  }
  return globalThis.__userProgressMap;
}

export class InMemoryProgressRepository implements IProgressRepository {
  async getCompletedChallenges(userId: string): Promise<ReadonlySet<string>> {
    const progressMap = getProgressMap();
    // Log map state BEFORE reading
    console.log(
      '[InMemoryProgressRepo GetCompleted] Map state before read:',
      progressMap
    );
    return progressMap.get(userId) ?? new Set<string>();
  }

  async markChallengeCompleted(
    userId: string,
    challengeId: string
  ): Promise<void> {
    const progressMap = getProgressMap();
    if (!progressMap.has(userId)) {
      progressMap.set(userId, new Set<string>());
    }
    const userSet = progressMap.get(userId)!;
    if (!userSet.has(challengeId)) {
      userSet.add(challengeId);
      // Log AFTER adding to set - Corrected syntax
      console.log(
        `[InMemoryProgressRepo MarkCompleted] Added '${challengeId}' for user '${userId}'. New map state:`,
        progressMap
      );
    } else {
      console.log(
        `[InMemoryProgressRepo MarkCompleted] User '${userId}' already completed '${challengeId}'.`
      );
    }
    // No file writing needed
  }

  async getAllProgress(): Promise<ReadonlyMap<string, ReadonlySet<string>>> {
    return getProgressMap();
  }

  async getProgressByUser(userId: string): Promise<ReadonlySet<string>> {
    return this.getCompletedChallenges(userId);
  }

  async clearAllProgress(): Promise<void> {
    const progressMap = getProgressMap();
    progressMap.clear();
    console.log('[InMemoryProgressRepo] All user progress cleared.');
  }

  async clearProgressByUser(userId: string): Promise<void> {
    const progressMap = getProgressMap();
    const deleted = progressMap.delete(userId);
    if (deleted) {
      console.log(
        `[InMemoryProgressRepo] Progress cleared for user '${userId}'.`
      );
    } else {
      console.log(
        `[InMemoryProgressRepo] No progress found for user '${userId}' to clear.`
      );
    }
  }
}

// Export a singleton instance of the in-memory repository
export const inMemoryProgressRepository = new InMemoryProgressRepository();
