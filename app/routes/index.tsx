import { createFileRoute } from '@tanstack/react-router';
import { createServerFn, type ServerFnCtx } from '@tanstack/react-start';
import { CodeEditor } from '../components/CodeEditor';
import { useState } from 'react';
import ivm from 'isolated-vm';

// Define the structured result type for validation
type ValidationResult =
  | { success: true; passed: boolean; result: any; expected: any } // Ran successfully, includes pass/fail
  | { success: false; error: string }; // Failed to run

// Server function to execute and validate code
const executeCode = createServerFn({
  method: 'POST',
}).handler(
  async (
    ctx: ServerFnCtx<'POST', 'data', undefined, undefined>
  ): Promise<ValidationResult> => {
    // Return ValidationResult
    const userCode = ctx.data;
    if (typeof userCode !== 'string') {
      return { success: false, error: 'Invalid input: Code must be a string.' };
    }

    let isolate: ivm.Isolate | null = null;
    let context: ivm.Context | null = null;
    const expectedOutput = 'Hello, World!'; // Hardcoded expected output for now

    try {
      isolate = new ivm.Isolate({ memoryLimit: 128 });
      context = await isolate.createContext();
      const jail = context.global;
      await jail.set('global', jail.derefInto());

      const script = await isolate.compileScript(userCode);
      await script.run(context, { timeout: 1000 });

      const greetFnRef = await context.global.get('greet', { reference: true });

      if (greetFnRef?.typeof !== 'function') {
        throw new Error("'greet' function not found or not a function.");
      }

      const result = await greetFnRef.apply(
        undefined,
        ['World'], // Hardcoded input for now
        { result: { copy: true } }
      );

      // Compare result with expected output
      // Using JSON.stringify for a simple comparison, might need refinement for complex types
      const passed = JSON.stringify(result) === JSON.stringify(expectedOutput);

      context.release();
      isolate.dispose();
      context = null;
      isolate = null;

      // Return detailed success result
      return {
        success: true,
        passed: passed,
        result: result,
        expected: expectedOutput,
      };
    } catch (err: any) {
      console.error('Execution Error:', err);
      // Ensure cleanup happens even on error
      if (context) {
        try {
          context.release();
        } catch (e) {
          console.warn('Error releasing context on error:', e);
        }
      }
      if (isolate) {
        try {
          isolate.dispose();
        } catch (e) {
          console.warn('Error disposing isolate on error:', e);
        }
      }
      return { success: false, error: err.message || String(err) };
    }
  }
);

// Route definition
export const Route = createFileRoute('/')({
  component: HomeComponent,
});

// Initial code for the editor (with typo)
const initialCode = `function greet(name) {
  // TODO: Fix the bug!
  retun 'Hello, ' + name + '!';
}`;

// Component definition
function HomeComponent() {
  const [code, setCode] = useState(initialCode);
  // Use the new ValidationResult type for state
  const [executionResult, setExecutionResult] =
    useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeChange = (value: string | undefined) => {
    setCode(value ?? '');
  };

  const handleRunCode = async () => {
    setIsLoading(true);
    setExecutionResult(null);
    try {
      // @ts-expect-error - Acknowledging TS error for client-side call signature
      const result = await executeCode({ data: code });
      setExecutionResult(result as ValidationResult); // Cast needed until TS issue resolved
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

  // JSX for the component
  return (
    <div style={{ padding: '20px' }}>
      <h1>Code Squad Challenge</h1>
      <CodeEditor
        initialCode={initialCode}
        language='javascript'
        onChange={handleCodeChange}
      />
      <button
        onClick={handleRunCode}
        disabled={isLoading}
        style={{ marginTop: '10px' }}
      >
        {isLoading ? 'Running...' : 'Run Code'}
      </button>

      {/* Updated Results Display */}
      {executionResult && (
        <div
          style={{
            marginTop: '20px',
            border: `2px solid ${executionResult.success ? (executionResult.passed ? 'green' : 'orange') : 'red'}`,
            padding: '10px',
          }}
        >
          <h3>Execution Result:</h3>
          {!executionResult.success ? (
            // Handle execution errors (syntax errors, etc.)
            <pre style={{ color: 'red' }}>Error: {executionResult.error}</pre>
          ) : executionResult.passed ? (
            // Handle successful execution and correct output
            <pre style={{ color: 'green' }}>
              SUCCESS! Output: {JSON.stringify(executionResult.result)}
            </pre>
          ) : (
            // Handle successful execution but incorrect output
            <pre style={{ color: 'orange' }}>
              FAILED! Output: {JSON.stringify(executionResult.result)}
              Expected: {JSON.stringify(executionResult.expected)}
            </pre>
          )}
        </div>
      )}

      {/* Keep code preview for debugging? */}
      {/* <pre
        style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}
      >
        Current Code State:
        {code}
      </pre> */}
    </div>
  );
}
