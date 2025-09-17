import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { TestResults } from '../components/TestResults';
import { Button } from '../components/Button';
import type { ChallengeExecutionResult } from '../server/challenges';
import {
  markChallengeCompletedServerFn,
  getCompletedChallengesServerFn,
} from '../server/progress.server';
import { createServerFn } from '@tanstack/react-start';
import { createServerHandler, ChallengeExecutionSchema } from '../server/utils/server-function';

// Simplified server function - Calls the core logic handler
const executeCode = createServerFn({
  method: 'POST',
}).handler(createServerHandler({
  schema: ChallengeExecutionSchema,
  handler: async (data) => {
    const { handleExecuteChallenge } = await import('../server/challenges');
    return handleExecuteChallenge(data);
  },
}));

// Simple cache for challenges (in production, use a more sophisticated cache)
let challengeCache: any[] | null = null;

// Route definition with Loader
export const Route = createFileRoute('/')({
  loader: async () => {
    console.log('Loader: Finding next challenge for user1 via ServerFn...');

    // Use cached challenges if available
    if (!challengeCache) {
      const { serviceContainer } = await import('../server/services/service-container');
      challengeCache = await serviceContainer.challengeRepository.getAllChallenges();
      console.log('Challenges loaded and cached');
    } else {
      console.log('Using cached challenges');
    }
    const allChallenges = challengeCache;

    // Call server function with no arguments
    let completedArray: string[] = [];
    try {
      completedArray = await getCompletedChallengesServerFn();
    } catch (error) {
      console.error('Error fetching completed challenges:', error);
      completedArray = [];
    }
    const completedSet = new Set(completedArray);

    console.log(
      '[Index Loader] Fetched completedSet (via ServerFn):',
      completedArray
    );

    const nextChallenge = allChallenges.find((c) => !completedSet.has(c.id));

    console.log(
      '[Index Loader] Found next challenge:',
      nextChallenge?.id ?? 'None'
    );

    if (!nextChallenge) {
      console.log(
        'Loader: All challenges completed! Reloading first challenge.'
      );
      const firstChallenge = allChallenges[0];
      if (!firstChallenge) throw new Error('No challenges defined!');
      return {
        id: firstChallenge.id,
        name: firstChallenge.name,
        description: firstChallenge.description,
        initialCode: firstChallenge.initialCode,
        functionName: firstChallenge.functionName,
        difficulty: firstChallenge.difficulty, // Pass difficulty
        allComplete: true,
      } as const;
    }
    console.log(`Loader: Loading next challenge: ${nextChallenge.id}`);
    return {
      id: nextChallenge.id,
      name: nextChallenge.name,
      description: nextChallenge.description,
      initialCode: nextChallenge.initialCode,
      functionName: nextChallenge.functionName,
      difficulty: nextChallenge.difficulty, // Pass difficulty
      allComplete: false,
    } as const;
  },
  component: HomeComponent,
});

// Component definition
function HomeComponent() {
  const challenge = Route.useLoaderData();
  const router = useRouter(); // Get router instance

  // Add back isClient state
  const [isClient, setIsClient] = useState(false);

  const [code, setCode] = useState(challenge.initialCode);
  const [executionResult, setExecutionResult] =
    useState<ChallengeExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add back client detection effect
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to reset code on challenge change
  useEffect(() => {
    console.log('Component: Challenge changed, resetting state.', challenge.id);
    setCode(challenge.initialCode);
    setExecutionResult(null);
  }, [challenge.id, challenge.initialCode]);

  const handleCodeChange = useCallback((value: string | undefined) => {
    setCode(value ?? '');
  }, []);

  const handleRunCode = useCallback(async () => {
    setIsLoading(true);
    setExecutionResult(null);
    try {
      // 1. Execute the code via server function
      const result = await executeCode({
        data: { challengeId: challenge.id, userCode: code },
      });

      setExecutionResult(result as ChallengeExecutionResult);

      // 2. If execution successful and all tests passed, mark complete and invalidate
      if (result.success && result.allPassed) {
        console.log('Challenge passed! Marking complete and invalidating...');
        try {
          await markChallengeCompletedServerFn({
            data: { userId: 'user1', challengeId: challenge.id }
          });
          console.log('Marked complete via server fn call from client.');

          await router.invalidate();
          console.log('Route invalidated.');
        } catch (markError) {
          console.error('Error marking challenge completed:', markError);
        }
      }
    } catch (error) {
      console.error('Error calling executeCode:', error);
      setExecutionResult({
        success: false,
        error: 'Failed to execute code on client.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [challenge.id, code, router]);

  // JSX for the component
  return (
    // Add container class for overall padding and centering
    <div className='container'>
      {challenge.allComplete && (
        // Add specific class for the completion banner
        <div
          className='all-complete-banner'
          // style={{ border: '2px solid blue', padding: '10px', marginBottom: '15px'}} // Remove inline style
        >
          🎉 You've completed all challenges! 🎉
        </div>
      )}
      <h1>
        {challenge.name} (Difficulty: {challenge.difficulty})
      </h1>
      <p>{challenge.description}</p>

      {/* Code Editor Area */}
      {isClient ? (
        <CodeEditor
          key={challenge.id}
          initialCode={challenge.initialCode}
          language='javascript'
          onChange={handleCodeChange}
        />
      ) : (
        <div
          className='loading-editor'
          style={{
            height: '500px',
            border: '1px dashed #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
          }}
        >
          Loading Editor...
        </div>
      )}

      <Button
        variant="run"
        onClick={handleRunCode}
        disabled={isLoading || challenge.allComplete || !isClient}
      >
        {isLoading ? 'Running...' : 'Run Test Cases'}
      </Button>

      {executionResult && <TestResults result={executionResult} />}
    </div>
  );
}
