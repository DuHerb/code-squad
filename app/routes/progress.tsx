import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  handleClearUserProgress,
  handleClearAllProgress,
} from '../server/progress';
import { getAllProgressServerFn } from '../server/progress.server';
import { progressRepository } from '../server/repositories/progress.repository';

// Server function to clear a specific user's progress
const clearUserProgressServer = createServerFn({ method: 'POST' })
  // Let type inference work, call dedicated handler
  .handler(async (ctx) => {
    // @ts-expect-error - Still might need suppressor for data access
    return await handleClearUserProgress(ctx.data);
  });

// Server function to clear all progress - Now simplified
const clearAllProgressServer = createServerFn({ method: 'POST' })
  // Let type inference work, call dedicated handler
  .handler(async (ctx) => {
    // ctx is unused now
    // Remove unused suppressor below
    return await handleClearAllProgress();
  });

// Server Function to Log Progress
const logProgressServer = createServerFn({ method: 'POST' }).handler(
  async () => {
    console.log('[Manual Log Button] Logging current server progress...');
    // Use repository directly (safe now)
    const progressMap = await progressRepository.getAllProgress();
    console.log('[Manual Log Button] Current progressMap:', progressMap);
    return { success: true, userCount: progressMap.size };
  }
);

export const Route = createFileRoute('/progress')({
  loader: async () => {
    console.log('Loading progress data via ServerFn...');
    // Call the server function
    const serializableProgress = await getAllProgressServerFn();
    console.log(
      '[Progress Loader] Fetched serializableProgress:',
      serializableProgress
    );

    // Data is already in the desired format Record<string, string[]>
    const progressData = Object.entries(serializableProgress).map(
      ([userId, completedChallenges]) => ({
        userId,
        completedChallenges,
      })
    );
    console.log('[Progress Loader] Mapped progressData:', progressData);
    return { progressData };
  },
  component: ProgressDashboard,
});

function ProgressDashboard() {
  const { progressData } = Route.useLoaderData();
  const router = useRouter(); // For invalidating data

  console.log(
    '[ProgressDashboard Component] Received progressData:',
    progressData
  );

  const handleClearUser = async (userId: string) => {
    if (
      confirm(`Are you sure you want to clear progress for user ${userId}?`)
    ) {
      try {
        // Keep suppressor on client call
        // @ts-expect-error - Acknowledging call signature mismatch
        await clearUserProgressServer({ data: { userId } });
        router.invalidate();
      } catch (error) {
        console.error('Failed to clear user progress:', error);
        alert('Failed to clear user progress.');
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear ALL user progress?')) {
      try {
        // Keep suppressor on client call
        // @ts-expect-error - Acknowledging call signature mismatch
        await clearAllProgressServer({ data: {} });
        router.invalidate();
      } catch (error) {
        console.error('Failed to clear all progress:', error);
        alert('Failed to clear all progress.');
      }
    }
  };

  // --- New Handler for Logging ---
  const handleLogProgress = async () => {
    try {
      console.log('Sending request to log server progress...');
      // @ts-ignore - Ignoring potential type mismatch for call
      const result = await logProgressServer({ data: {} }); // Send empty data for POST
      console.log('Server log response:', result);
      alert(`Server progress logged. User count: ${result.userCount}`);
    } catch (error) {
      console.error('Failed to trigger server log:', error);
      alert('Failed to trigger server log.');
    }
  };

  return (
    <div className='container'>
      <h1>User Progress Dashboard</h1>
      <button className='button-log' onClick={handleLogProgress}>
        Log Server Progress Map (Console)
      </button>
      <button className='button-clear' onClick={handleClearAll}>
        Clear All Progress
      </button>
      <div className='progress-dashboard'>
        {progressData.length === 0 && <p>No user progress recorded yet.</p>}
        {progressData.map(({ userId, completedChallenges }) => (
          <div key={userId} className='progress-card'>
            <h2>User: {userId}</h2>
            <p>Completed ({completedChallenges.length}):</p>
            {completedChallenges.length > 0 ? (
              <ul>
                {completedChallenges.map((challengeId) => (
                  <li key={challengeId}>{challengeId}</li>
                ))}
              </ul>
            ) : (
              <p>None</p>
            )}
            <button
              className='button-clear-user'
              onClick={() => handleClearUser(userId)}
            >
              Clear This User's Progress
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
