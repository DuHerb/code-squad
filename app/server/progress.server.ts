// import 'server-only'; // Not needed here anymore
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
// Remove import for deleted file
// import { readProgressData, writeProgressData } from './progress.io';
// Import the actual repository (which now points to the in-memory one)
import { progressRepository } from './repositories/progress.repository';

// Removed getAllProgressServerFn and getCompletedChallengesServerFn

// --- Server Function for Getting All Progress ---
// Needed for the /progress route loader when running client-side
export const getAllProgressServerFn = createServerFn({
  method: 'GET',
}).handler(async (/* ctx: any - not needed */) => {
  console.log('[ServerFn] Getting all progress (In-Memory)...');
  // Call the repository (safe now)
  const allProgress = await progressRepository.getAllProgress();
  // Convert Map<string, Set<string>> to Record<string, string[]>
  const serializableProgress: Record<string, string[]> = {};
  for (const [userId, completedSet] of allProgress.entries()) {
    serializableProgress[userId] = Array.from(completedSet);
  }
  console.log(
    '[ServerFn] Returning serializable progress:',
    serializableProgress
  );
  return serializableProgress;
});

// --- Server Function for Getting Completed Challenges ---
// No longer needs input argument

export const getCompletedChallengesServerFn = createServerFn({
  method: 'GET',
}).handler(async (/* ctx: any - no longer needed */) => {
  console.log(
    '[ServerFn] Getting completed challenges for user1 (In-Memory)...'
  );
  const userId = 'user1'; // Hardcode userId

  // No input extraction/validation needed

  console.log(
    `[ServerFn] Getting completed challenges for user: ${userId} (In-Memory)`
  );
  // Use the repository (which uses globalThis)
  const completedSet = await progressRepository.getCompletedChallenges(userId);
  console.log('[ServerFn] Returning completedSet:', Array.from(completedSet));
  return Array.from(completedSet);
});

// --- Server Function for Marking Challenge Completed ---
// Keep this one as it's called from client-side code
const MarkCompletedInputSchema = z.object({
  userId: z.string(),
  challengeId: z.string(),
});

export const markChallengeCompletedServerFn = createServerFn({
  method: 'POST',
}).handler(async (ctx: any) => {
  console.log('[ServerFn] Marking challenge complete (In-Memory)...');
  console.log('[markChallengeCompletedServerFn] Received context:', ctx);

  let rawInput: unknown;
  try {
    // Prioritize ctx.data as the client now sends { data: ... }
    if (ctx && ctx.data) {
      console.log('[ServerFn] Found ctx.data, using it as rawInput.');
      rawInput = ctx.data;
    } else if (ctx && typeof ctx.request?.json === 'function') {
      // Fallback to parsing request body
      console.log(
        '[ServerFn] ctx.data not found, attempting ctx.request.json()...'
      );
      rawInput = await ctx.request.json();
      console.log('[ServerFn] Parsed request body:', rawInput);
    } else {
      // Final fallback
      console.log(
        '[ServerFn] ctx.data and ctx.request.json() not available/found, falling back to ctx properties...'
      );
      rawInput = ctx.input ?? ctx; // Check input or ctx itself
    }
  } catch (e) {
    console.error('[ServerFn] Error extracting/parsing input:', e);
    rawInput = ctx.input ?? ctx.data ?? ctx; // Fallback on error
  }

  // Validate the extracted rawInput
  const validation = MarkCompletedInputSchema.safeParse(rawInput);
  if (!validation.success) {
    console.error(
      '[ServerFn] Invalid input for MarkCompleted. Raw input was:',
      rawInput
    );
    console.error('[ServerFn] Validation error:', validation.error);
    throw new Error('Invalid input for MarkChallengeCompleted');
  }
  const input = validation.data;

  const { userId, challengeId } = input;
  await progressRepository.markChallengeCompleted(userId, challengeId);
  console.log(
    `[ServerFn] In-memory progress updated for user ${userId}, challenge ${challengeId}`
  );
  // Log the map state right after the update call (no suppression needed)
  console.log(
    '[ServerFn] Map state after update:',
    globalThis.__userProgressMap
  );

  return { success: true };
});

// Add other server functions if needed (e.g., for clearing progress)
