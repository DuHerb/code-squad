import type { IChallengeRepository } from './interfaces';

// --- Move Types Here ---
export interface TestCase {
  input: any[];
  expectedOutput: any;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  functionName: string;
  initialCode: string;
  testCases: TestCase[];
}
// --- End Types ---

// Simple in-memory store for challenges
const challenges: Challenge[] = [
  {
    id: 'hello-world-typo',
    name: 'Hello World Typo',
    description: 'Fix the typo in the return statement.',
    difficulty: 1,
    functionName: 'greet',
    initialCode: `function greet(name) {\n  // Fix the typo!\n  retun \'Hello, \' + name + \'!';\n}`,
    testCases: [
      { input: ['World'], expectedOutput: 'Hello, World!' },
      { input: ['Code Squad'], expectedOutput: 'Hello, Code Squad!' },
    ],
  },
  {
    id: 'simple-add',
    name: 'Simple Addition',
    description: 'Implement a function that adds two numbers.',
    difficulty: 1,
    functionName: 'add',
    initialCode: `function add(a, b) {\n  // Return the sum of a and b\n  return undefined; // Placeholder\n}`,
    testCases: [
      { input: [1, 2], expectedOutput: 3 },
      { input: [10, -5], expectedOutput: 5 },
      { input: [0, 0], expectedOutput: 0 },
    ],
  },
];

export class InMemoryChallengeRepository implements IChallengeRepository {
  // Return challenges sorted by difficulty (sync operation)
  getAllChallenges(): Challenge[] {
    console.log('[InMemoryChallengeRepo] Getting all challenges...');
    // Return a copy sorted by difficulty
    return [...challenges].sort((a, b) => a.difficulty - b.difficulty);
  }

  // Find challenge by ID (sync operation)
  getChallengeById(id: string): Challenge | undefined {
    console.log(`[InMemoryChallengeRepo] Getting challenge by ID: ${id}`);
    return challenges.find((c) => c.id === id);
  }
}

// Export a singleton instance for easy use (simple DI)
export const challengeRepository = new InMemoryChallengeRepository();
