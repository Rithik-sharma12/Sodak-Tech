'use client'

import { ReactNode, useRef, useState } from 'react'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
  initialRatio?: number
}

export function SplitPane({ left, right, initialRatio = 0.4 }: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [ratio, setRatio] = useState(initialRatio)

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const newRatio = (e.clientX - rect.left) / rect.width

    // Constrain ratio between 20% and 80%
    if (newRatio > 0.2 && newRatio < 0.8) {
      setRatio(newRatio)
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full overflow-hidden"
      onMouseMove={isDragging ? (e) => handleMouseMove(e as any) : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left pane */}
      <div style={{ width: `${ratio * 100}%` }} className="overflow-hidden flex flex-col">
        {left}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 bg-border hover:bg-primary-500 transition-colors cursor-col-resize flex-shrink-0 ${
          isDragging ? 'bg-primary-500' : ''
        }`}
        aria-label="Resize divider"
      />

      {/* Right pane */}
      <div style={{ width: `${(1 - ratio) * 100}%` }} className="overflow-hidden flex flex-col">
        {right}
      </div>
    </div>
  )
}
