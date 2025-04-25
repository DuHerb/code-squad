import { createFileRoute, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import {
  handleClearUserProgress,
  handleClearAllProgress,
} from '../server/progress';
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
    console.log('Loading progress data (Direct Repo Call)...');
    // Use repository directly
    const progressMap = await progressRepository.getAllProgress();
    console.log('[Progress Loader] Fetched progressMap:', progressMap);

    const progressData = Array.from(progressMap.entries()).map(
      ([userId, completedSet]) => ({
        userId,
        completedChallenges: Array.from(completedSet),
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
    <div style={{ padding: '20px' }}>
      <h1>User Progress Dashboard</h1>
      <button
        onClick={handleLogProgress}
        style={{
          marginBottom: '20px',
          marginLeft: '10px',
          backgroundColor: '#e0e0ff',
          border: '1px solid blue',
        }}
      >
        Log Server Progress Map (Console)
      </button>
      <button
        onClick={handleClearAll}
        style={{
          marginBottom: '20px',
          backgroundColor: '#ffdddd',
          border: '1px solid red',
        }}
      >
        Clear All Progress
      </button>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {progressData.length === 0 && <p>No user progress recorded yet.</p>}
        {progressData.map(({ userId, completedChallenges }) => (
          <div
            key={userId}
            style={{
              border: '1px solid #ccc',
              padding: '15px',
              minWidth: '200px',
            }}
          >
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
              onClick={() => handleClearUser(userId)}
              style={{
                marginTop: '10px',
                backgroundColor: '#ffeeee',
                border: '1px solid orange',
              }}
            >
              Clear This User's Progress
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
