import React from 'react';
import type { ChallengeExecutionResult } from '../server/challenges';

interface TestResultsProps {
  result: ChallengeExecutionResult;
}

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