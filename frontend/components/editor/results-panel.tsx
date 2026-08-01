'use client'

import { useState } from 'react'
import { VerdictBadge } from '@/components/ui/verdict-badge'
import type { ExecutionResult } from '@/lib/api'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ResultsPanelProps {
  result?: ExecutionResult | null
  isLoading?: boolean
}

export function ResultsPanel({ result, isLoading = false }: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'testCases' | 'output'>('testCases')
  const [expandedTestCase, setExpandedTestCase] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-surface-base border-t border-border">
        <div className="flex items-center justify-center h-full">
          <div className="text-neutral-400">Running tests...</div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col h-full bg-surface-base border-t border-border">
        <div className="flex items-center justify-center h-full">
          <div className="text-neutral-500 text-center">
            <p className="text-sm">Run or submit your solution to see results</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface-base border-t border-border overflow-hidden">
      {/* Header with verdict */}
      <div className="h-14 border-b border-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <VerdictBadge verdict={result.verdict} />
        <div className="flex items-center gap-4 text-sm text-neutral-400">
          <span>Runtime: {result.runtime}ms</span>
          <span>Memory: {result.memory}MB</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-surface-card sticky top-0 z-10">
        {(['console', 'testCases', 'output'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary-500 text-foreground'
                : 'text-neutral-400 hover:text-neutral-300 border-b-2 border-transparent'
            }`}
          >
            {tab === 'console' && 'Console'}
            {tab === 'testCases' && 'Test Cases'}
            {tab === 'output' && 'Output'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'console' && (
          <div className="space-y-2">
            <div className="text-sm font-mono text-neutral-300 whitespace-pre-wrap break-words">
              {result.output || 'No console output'}
            </div>
          </div>
        )}

        {activeTab === 'testCases' && (
          <div className="space-y-3">
            {result.testCases && result.testCases.length > 0 ? (
              result.testCases.map((testCase) => (
                <div
                  key={testCase.id}
                  className="border border-border rounded-lg overflow-hidden bg-surface-card hover:border-primary-500/50 transition-colors"
                >
                  <button
                    onClick={() =>
                      setExpandedTestCase(expandedTestCase === testCase.id ? null : testCase.id)
                    }
                    className="w-full flex items-center justify-between p-3 hover:bg-surface-raised/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          testCase.status === 'accepted' ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-sm font-medium text-foreground">Test {testCase.caseNumber}</span>
                      {testCase.status === 'accepted' ? (
                        <span className="text-xs text-green-300">Passed</span>
                      ) : (
                        <span className="text-xs text-red-300">Failed</span>
                      )}
                    </div>
                  {expandedTestCase === testCase.id ? (
                    <ChevronUp size={16} className="text-neutral-400" />
                  ) : (
                    <ChevronDown size={16} className="text-neutral-400" />
                  )}
                </button>

                {expandedTestCase === testCase.id && (
                  <div className="border-t border-border bg-surface-base p-3 space-y-3 text-xs">
                    <div>
                      <p className="text-neutral-500 mb-1">Input:</p>
                      <p className="font-mono text-primary-300 bg-primary-900/10 p-2 rounded whitespace-pre-wrap break-words max-h-24 overflow-auto">
                        {testCase.input}
                      </p>
                    </div>

                    <div>
                      <p className="text-neutral-500 mb-1">Expected Output:</p>
                      <p className="font-mono text-green-300 bg-green-900/10 p-2 rounded whitespace-pre-wrap break-words max-h-24 overflow-auto">
                        {testCase.expected}
                      </p>
                    </div>

                    <div>
                      <p className="text-neutral-500 mb-1">Actual Output:</p>
                      <p className={`font-mono p-2 rounded whitespace-pre-wrap break-words max-h-24 overflow-auto ${
                        testCase.status === 'accepted'
                          ? 'text-green-300 bg-green-900/10'
                          : 'text-red-300 bg-red-900/10'
                      }`}>
                        {testCase.actual}
                      </p>
                    </div>

                    <div className="flex gap-4 text-xs text-neutral-400">
                      <span>Runtime: {testCase.runtime.toFixed(2)}ms</span>
                      <span>Memory: {testCase.memory.toFixed(1)}MB</span>
                    </div>
                  </div>
                )}
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-500 py-8">
                <p className="text-sm">No test cases to display</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'output' && (
          <div className="font-mono text-sm text-neutral-300 whitespace-pre-wrap break-words">
            {result.output || 'No output'}
          </div>
        )}
      </div>
    </div>
  )
}
