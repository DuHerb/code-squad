export interface TestCase {
  input: any[]; // Arguments to pass to the function
  expectedOutput: any; // Expected return value
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  functionName: string; // The function the user needs to fix/implement
  initialCode: string;
  testCases: TestCase[];
}

// Simple in-memory store for challenges
const challenges: Challenge[] = [
  {
    id: 'hello-world-typo',
    name: 'Hello World Typo',
    description: 'Fix the typo in the return statement.',
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
    functionName: 'add',
    initialCode: `function add(a, b) {\n  // Return the sum of a and b\n  return undefined; // Placeholder\n}`,
    testCases: [
      { input: [1, 2], expectedOutput: 3 },
      { input: [10, -5], expectedOutput: 5 },
      { input: [0, 0], expectedOutput: 0 },
    ],
  },
  // Add more challenges here later
];

// Server function to get all challenge definitions (or maybe just IDs/names later)
// For now, let's just get a specific challenge by ID
export function getChallengeById(id: string): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
