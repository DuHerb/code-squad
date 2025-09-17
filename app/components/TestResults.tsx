import React from 'react';
import type { ChallengeExecutionResult } from '../server/challenges';

interface TestResultsProps {
  result: ChallengeExecutionResult;
}

/**
 * Renders execution results for a challenge run, showing an overall status and per-test details.
 *
 * When `result.success` is false, displays the execution error. Otherwise shows an overall
 * "PASSED"/"FAILED" status (based on `result.allPassed`) and a list of individual test case results.
 *
 * @param result - The challenge execution result to render (includes `success`, optional `error`,
 *   `allPassed`, and an array of per-test `results`).
 * @returns A React element containing the formatted execution summary and test-case list.
 */
export function TestResults({ result }: TestResultsProps) {
  if (!result.success) {
    return (
      <div className="results-container results-fail">
        <h3>Execution Result:</h3>
        <pre className="test-status-error">
          Error: {result.error}
        </pre>
      </div>
    );
  }

  return (
    <div className={`results-container ${
      result.allPassed ? 'results-success' : 'results-partial'
    }`}>
      <h3>Execution Result:</h3>
      <h4 className={
        result.allPassed ? 'test-status-passed' : 'test-status-failed'
      }>
        Overall: {result.allPassed ? 'PASSED' : 'FAILED'}
      </h4>
      <ul>
        {result.results.map((res, index) => (
          <TestCaseResult key={index} result={res} />
        ))}
      </ul>
    </div>
  );
}

interface TestCaseResultProps {
  result: {
    input: any[];
    output: any;
    expected: any;
    passed: boolean;
    error?: string;
  };
}

/**
 * Renders a single test-case result as an <li> showing input, expected value, output, and status.
 *
 * Displays `input`, `expected`, and `output` using `JSON.stringify`. The status label and CSS class
 * reflect the test outcome with this precedence: if `result.passed` is true the status is "Passed";
 * otherwise if `result.error` is present the status is "Error: <error>" (class `test-status-error`);
 * otherwise the status is "Failed" (class `test-status-failed`).
 *
 * @param result - The test case result object (contains `input`, `expected`, `output`, `passed`, and optional `error`).
 * @returns A React list item element (<li>) representing the test case.
 */
function TestCaseResult({ result }: TestCaseResultProps) {
  return (
    <li>
      Input: {JSON.stringify(result.input)} <br />
      Expected: {JSON.stringify(result.expected)} <br />
      Output: {JSON.stringify(result.output)} <br />
      <span className={
        result.passed
          ? 'test-status-passed'
          : result.error
            ? 'test-status-error'
            : 'test-status-failed'
      }>
        Status:{' '}
        {result.passed
          ? 'Passed'
          : result.error
            ? `Error: ${result.error}`
            : 'Failed'}
      </span>
    </li>
  );
}