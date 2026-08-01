'use client'

import { useState, useEffect } from 'react'
import { Lock, CheckCircle, Clock } from 'lucide-react'

interface ProblemEditorialProps {
  problemId: string
}

export function ProblemEditorial({ problemId }: ProblemEditorialProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [unlockProgress, setUnlockProgress] = useState({
    solved: false,
    attempts: 1, // out of 3
    hoursRemaining: 18, // out of 24
  })

  // In real app, fetch from API
  useEffect(() => {
    // Mock: editorial_unlocked: false means show lock state
    // Only show content if editorial_unlocked: true
    setIsUnlocked(false)
  }, [problemId])

  const canUnlock = unlockProgress.solved || unlockProgress.attempts >= 3 || unlockProgress.hoursRemaining <= 0

  if (isUnlocked && canUnlock) {
    // Only render content if API explicitly returns editorial_unlocked: true
    return (
      <div className="p-6 space-y-6 overflow-y-auto h-full">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3">Editorial</h2>
          <div className="prose prose-invert max-w-none space-y-4">
            <div className="bg-surface-raised border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Approach 1: Brute Force</h3>
              <p className="text-neutral-300 text-sm">
                The simplest approach is to try all possible combinations. For each position, we have limited choices...
              </p>
              <pre className="bg-surface-base p-3 rounded text-xs text-neutral-300 overflow-x-auto">
                <code>{`function solve(arr) {
  let result = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      result = Math.max(result, arr[i] + arr[j]);
    }
  }
  return result;
}`}</code>
              </pre>
              <p className="text-xs text-neutral-500">Time: O(n²) | Space: O(1)</p>
            </div>

            <div className="bg-surface-raised border border-border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Approach 2: Optimized (Single Pass)</h3>
              <p className="text-neutral-300 text-sm">
                We can solve this in a single pass by keeping track of the maximum value seen so far...
              </p>
              <pre className="bg-surface-base p-3 rounded text-xs text-neutral-300 overflow-x-auto">
                <code>{`function solve(arr) {
  let maxVal = Math.max(...arr);
  let maxSum = 0;
  for (let num of arr) {
    if (num !== maxVal) {
      maxSum = Math.max(maxSum, num + maxVal);
    }
  }
  return maxSum;
}`}</code>
              </pre>
              <p className="text-xs text-neutral-500">Time: O(n) | Space: O(1)</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Locked state - default
  return (
    <div className="p-6 h-full flex flex-col items-center justify-center bg-gradient-to-b from-surface-raised to-surface-base">
      <div className="text-center space-y-6 max-w-sm">
        {/* Lock icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-surface-raised rounded-full border-2 border-primary-500/30">
            <Lock size={32} className="text-primary-500" />
          </div>
        </div>

        {/* Message */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Editorial is Locked</h3>
          <p className="text-neutral-400 text-sm">
            Unlock by solving, making genuine attempts, or waiting 24 hours:
          </p>
        </div>

        {/* Unlock conditions */}
        <div className="space-y-3">
          {/* Condition 1: Solve */}
          <div className="flex items-start gap-3 p-3 bg-surface-card rounded-lg border border-border">
            <div className="mt-0.5">
              {unlockProgress.solved ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-neutral-600" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Solve the problem</p>
              <p className="text-xs text-neutral-500">Get "Accepted" verdict</p>
            </div>
          </div>

          {/* Condition 2: Attempts */}
          <div className="flex items-start gap-3 p-3 bg-surface-card rounded-lg border border-border">
            <div className="mt-0.5">
              {unlockProgress.attempts >= 3 ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-neutral-600 flex items-center justify-center">
                  <span className="text-xs text-neutral-400">{unlockProgress.attempts}</span>
                </div>
              )}
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-foreground">Make 3 genuine attempts</p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i <= unlockProgress.attempts ? 'bg-primary-500' : 'bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-1">{unlockProgress.attempts}/3 completed</p>
            </div>
          </div>

          {/* Condition 3: Wait */}
          <div className="flex items-start gap-3 p-3 bg-surface-card rounded-lg border border-border">
            <div className="mt-0.5">
              {unlockProgress.hoursRemaining <= 0 ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <Clock size={20} className="text-neutral-500" />
              )}
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-foreground">Or wait 24 hours</p>
              <p className="text-xs text-neutral-500 mt-1">
                {unlockProgress.hoursRemaining > 0
                  ? `${unlockProgress.hoursRemaining}h ${60 - Math.floor(Math.random() * 60)}m remaining`
                  : 'Available now'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
