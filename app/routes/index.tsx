import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect } from 'react';
import {
  getAllChallenges,
  getChallengeById,
  type Challenge,
  handleExecuteChallenge,
  type ChallengeExecutionResult,
} from '../server/challenges';
import { getCurrentUserCompletedChallenges } from '../server/progress';
import { CodeEditor } from '../components/CodeEditor';

// Simplified server function - Calls the core logic handler
const executeCode = createServerFn({ method: 'POST' })
  // Keep handler simple, calling the dedicated logic function
  .handler(async (ctx) => {
    // @ts-expect-error - Acknowledging ctx.data type mismatch from createServerFn
    return await handleExecuteChallenge(ctx.data);
  });

// Route definition with Loader
export const Route = createFileRoute('/')({
  loader: async () => {
    console.log('Loader: Finding next challenge for user1...');
    const allChallenges = getAllChallenges();
    const completedSet = getCurrentUserCompletedChallenges();
    console.log('Loader: Completed challenges:', completedSet);
    const nextChallenge = allChallenges.find((c) => !completedSet.has(c.id));
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

  const handleCodeChange = (value: string | undefined) => {
    setCode(value ?? '');
  };

  const handleRunCode = async () => {
    setIsLoading(true);
    setExecutionResult(null);
    try {
      const result = await executeCode({
        // @ts-ignore - Ignoring persistent type mismatch for createServerFn call
        data: { challengeId: challenge.id, userCode: code },
      });
      setExecutionResult(result as ChallengeExecutionResult);

      if (result.success && result.allPassed) {
        console.log('Challenge passed! Invalidating route...');
        router.invalidate();
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
  };

  // JSX for the component - Needs update for detailed results display
  return (
    <div style={{ padding: '20px' }}>
      {challenge.allComplete && (
        <div
          style={{
            border: '2px solid blue',
            padding: '10px',
            marginBottom: '15px',
          }}
        >
          🎉 You've completed all challenges! 🎉
        </div>
      )}
      <h1>
        {challenge.name} (Difficulty: {challenge.difficulty})
      </h1>
      <p>{challenge.description}</p>

      {/* Conditionally render CodeEditor (NO Suspense/Lazy) */}
      {isClient ? (
        <CodeEditor
          key={challenge.id}
          initialCode={challenge.initialCode}
          language='javascript'
          onChange={handleCodeChange}
        />
      ) : (
        // Placeholder during SSR / initial client render before mount
        <div
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

      <button
        onClick={handleRunCode}
        disabled={isLoading || challenge.allComplete || !isClient} // Keep button disabled until client render
        style={{ marginTop: '10px' }}
      >
        {isLoading ? 'Running...' : 'Run Test Cases'}
      </button>

      {executionResult && (
        <div
          style={{
            marginTop: '20px',
            border: `2px solid ${executionResult.success ? (executionResult.allPassed ? 'green' : 'orange') : 'red'}`,
            padding: '10px',
          }}
        >
          <h3>Execution Result:</h3>
          {!executionResult.success ? (
            <pre style={{ color: 'red' }}>Error: {executionResult.error}</pre>
          ) : (
            // Display individual test case results
            <div>
              <h4
                style={{
                  color: executionResult.allPassed ? 'green' : 'orange',
                }}
              >
                Overall: {executionResult.allPassed ? 'PASSED' : 'FAILED'}
              </h4>
              <ul>
                {executionResult.results.map((res, index) => (
                  <li
                    key={index}
                    style={{
                      borderBottom: '1px dashed #eee',
                      paddingBottom: '5px',
                      marginBottom: '5px',
                      color: res.passed
                        ? 'green'
                        : res.error
                          ? 'red'
                          : 'orange',
                    }}
                  >
                    Input: {JSON.stringify(res.input)} <br />
                    Expected: {JSON.stringify(res.expected)} <br />
                    Output: {JSON.stringify(res.output)} <br />
                    Status:{' '}
                    {res.passed
                      ? 'Passed'
                      : res.error
                        ? `Error: ${res.error}`
                        : 'Failed'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
