import 'server-only';
import { z } from 'zod';
import { createServerFn } from '@tanstack/react-start';
import { serviceContainer } from './services/service-container';
import { createServerHandler, UserSchema } from './utils/server-function';

// Removed getAllProgressServerFn and getCompletedChallengesServerFn

// --- Server Function for Getting All Progress ---
export const getAllProgressServerFn = createServerFn({
  method: 'GET',
}).handler(createServerHandler({
  handler: async () => {
    console.log('[ServerFn] Getting all progress (In-Memory)...');
    const allProgress = await serviceContainer.progressRepository.getAllProgress();
    // Convert Map<string, Set<string>> to Record<string, string[]>
    const serializableProgress: Record<string, string[]> = {};
    for (const [userId, completedSet] of allProgress.entries()) {
      serializableProgress[userId] = Array.from(completedSet);
    }
    console.log('[ServerFn] Returning serializable progress:', serializableProgress);
    return serializableProgress;
  },
}));

// --- Server Function for Getting Completed Challenges ---
export const getCompletedChallengesServerFn = createServerFn({
  method: 'GET',
}).handler(createServerHandler({
  handler: async () => {
    console.log('[ServerFn] Getting completed challenges for user1 (In-Memory)...');
    const userId = 'user1'; // Hardcode userId

    console.log(`[ServerFn] Getting completed challenges for user: ${userId} (In-Memory)`);
    const completedSet = await serviceContainer.progressRepository.getCompletedChallenges(userId);
    console.log('[ServerFn] Returning completedSet:', Array.from(completedSet));
    return Array.from(completedSet);
  },
}));

// --- Server Function for Marking Challenge Completed ---
export const markChallengeCompletedServerFn = createServerFn({
  method: 'POST',
}).handler(createServerHandler({
  schema: UserSchema.extend({ challengeId: z.string() }),
  handler: async ({ userId, challengeId }) => {
    console.log('[ServerFn] Marking challenge complete (In-Memory)...');

    await serviceContainer.progressRepository.markChallengeCompleted(userId, challengeId);
    console.log(`[ServerFn] In-memory progress updated for user ${userId}, challenge ${challengeId}`);
    console.log('[ServerFn] Map state after update:', globalThis.__userProgressMap);

    return { success: true };
  },
}));

// Add other server functions if needed (e.g., for clearing progress)
