import { z } from 'zod';

/**
 * Creates a server-side handler wrapper that extracts and (optionally) validates input before invoking a business handler.
 *
 * The returned async function accepts a request context (`ctx`). If a Zod `schema` is provided the wrapper extracts raw input from, in order of availability:
 * - `ctx.data`
 * - `await ctx.request.json()` (if `ctx.request.json` is a function)
 * - `ctx.input`
 * - `ctx` (fallback)
 *
 * The raw input is validated with `schema.safeParse`. On validation failure an `Error` is thrown with message prefixed by "Invalid input: ". On success the parsed data is passed to `handler`.
 *
 * If no `schema` is provided the function uses `ctx.data` (or `{}`) cast to the input type and invokes `handler` directly.
 *
 * @param options.schema - Optional Zod schema used to validate and parse the incoming input.
 * @param options.handler - Function that performs the actual handling logic; receives the validated (or raw when no schema) input and may return a value or a promise.
 * @returns An async function that takes a request context (`ctx`) and returns the result of `handler`.
 * @throws Error When input validation fails (message starts with "Invalid input: ").
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