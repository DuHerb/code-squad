// import 'server-only'; // Temporarily remove this
// import fs from 'fs/promises'; // No longer needed here
// import path from 'path'; // No longer needed here
import type { IProgressRepository } from './interfaces';
// Import the new IO functions using the correct relative path
// import { readProgressData, writeProgressData } from '../progress.io';

// type ProgressFileData = { ... }; // Type is defined in progress.io.ts now, not strictly needed here

// Import the in-memory repository instance
import { inMemoryProgressRepository } from './in-memory.progress.repository';

// Original JsonProgressRepository class definition remains here...
// (We can comment it out or leave it for future use)
/*
export class JsonProgressRepository implements IProgressRepository {
  async getCompletedChallenges(userId: string): Promise<ReadonlySet<string>> {
    const progressMap = await readProgressData(); // Would use progress.io
    return progressMap.get(userId) ?? new Set<string>();
  }
  // ... other methods using read/writeProgressData ...
}
*/

// Export the IN-MEMORY repository instance as the primary export
export const progressRepository: IProgressRepository =
  inMemoryProgressRepository;
