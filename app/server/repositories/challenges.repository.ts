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
    name: 'Debug: Hello World Typo',
    description: 'Debug the function to fix the typo in the return statement.',
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
    name: 'Debug: Simple Addition',
    description: 'Debug the function to correctly add two numbers.',
    difficulty: 1,
    functionName: 'add',
    initialCode: `function add(a, b) {\n  // Debug this function - it's not adding correctly!\n  return a - b; // Logical error: subtraction instead of addition\n}`,
    testCases: [
      { input: [1, 2], expectedOutput: 3 },
      { input: [10, -5], expectedOutput: 5 },
      { input: [0, 0], expectedOutput: 0 },
    ],
  },
  // --- Replace Add Two Numbers with Sum Array ---
  {
    id: 'sum-array',
    name: 'Debug: Sum Array Elements',
    description:
      'Debug the function to correctly sum array elements. Pay attention to the empty array case.',
    difficulty: 2, // Slightly harder than basic add
    functionName: 'sumArray',
    initialCode: `function sumArray(numbers) {\n  // Debug this function - it doesn't handle all cases correctly.\n  if (numbers.length === 0) {\n     // What should happen here?\n  }\n  return numbers.reduce((sum, current) => sum + current); // Fails on empty array, initial value needed
}`,
    testCases: [
      { input: [[1, 2, 3]], expectedOutput: 6 },
      { input: [[10, -5, 2]], expectedOutput: 7 },
      { input: [[5]], expectedOutput: 5 },
      { input: [[]], expectedOutput: 0 }, // Test empty array
      { input: [[0, 0, 0]], expectedOutput: 0 },
    ],
  },
  // --- Keep Reverse String challenge ---
  {
    id: 'reverse-string',
    name: 'Debug: Reverse String',
    description: 'Debug the function to correctly reverse the string.',
    difficulty: 2,
    functionName: 'reverseString',
    initialCode: `function reverseString(str) {\n  // Debug this function - it's not reversing fully.\n  let reversed = \'\';\n  for (let i = str.length - 1; i > 0; i--) { // Off-by-one error (should be i >= 0)\n    reversed += str[i];\n  }\n  return reversed;\n}`,
    testCases: [
      { input: ['hello'], expectedOutput: 'olleh' },
      { input: ['world'], expectedOutput: 'dlrow' },
      { input: ['a'], expectedOutput: 'a' },
      { input: [''], expectedOutput: '' },
    ],
  },
  // --- New Challenge 3: Is Even? ---
  {
    id: 'is-even',
    name: 'Debug: Is Even?',
    description:
      'Debug the function to correctly determine if a number is even.',
    difficulty: 1, // Simple modulo operation
    functionName: 'isEven',
    initialCode: `function isEven(num) {\n  // Debug this function - the condition is wrong.\n  return num % 2 === 1; // Logical error: checks for odd instead of even\n}`,
    testCases: [
      { input: [2], expectedOutput: true },
      { input: [3], expectedOutput: false },
      { input: [0], expectedOutput: true },
      { input: [-4], expectedOutput: true },
      { input: [-7], expectedOutput: false },
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
