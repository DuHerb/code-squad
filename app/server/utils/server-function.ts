import { z } from 'zod';

/**
 * Helper function to create server function handler with validation and error handling
 */
export function createServerHandler<TInput, TOutput>(options: {
  schema?: z.ZodSchema<TInput>;
  handler: (input: TInput) => Promise<TOutput> | TOutput;
}) {
  return async (ctx: any) => {
    try {
      let input: TInput;

      if (!options.schema) {
        input = (ctx?.data ?? {}) as TInput;
      } else {
        // Extract data from context for POST requests
        let rawInput: unknown;

        if (ctx?.data) {
          rawInput = ctx.data;
        } else if (ctx?.request?.json && typeof ctx.request.json === 'function') {
          rawInput = await ctx.request.json();
        } else {
          rawInput = ctx?.input ?? ctx;
        }

        // Validate input using schema
        const validation = options.schema.safeParse(rawInput);
        if (!validation.success) {
          throw new Error(`Invalid input: ${validation.error.message}`);
        }
        input = validation.data;
      }

      return await options.handler(input);
    } catch (error: any) {
      console.error('[ServerFunction Error]:', error);
      throw error;
    }
  };
}

/**
 * Schema for operations that require user ID and challenge ID
 */
export const UserChallengeSchema = z.object({
  userId: z.string(),
  challengeId: z.string(),
});

/**
 * Schema for operations that only require user ID
 */
export const UserSchema = z.object({
  userId: z.string(),
});

/**
 * Schema for challenge execution
 */
export const ChallengeExecutionSchema = z.object({
  challengeId: z.string(),
  userCode: z.string(),
});