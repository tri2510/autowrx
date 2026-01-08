// React hook for managing console output
import { useState, useCallback, useRef } from 'react'

export interface ConsoleEntry {
  id: string
  timestamp: Date
  message: string
  type: 'stdout' | 'stderr' | 'info' | 'success' | 'error'
}

export function useConsoleOutput(maxEntries = 500) {
  const [entries, setEntries] = useState<ConsoleEntry[]>([])
  const idCounterRef = useRef(0)

  const addEntry = useCallback((message: string, type: ConsoleEntry['type'] = 'info') => {
    const entry: ConsoleEntry = {
      id: `console-${idCounterRef.current++}`,
      timestamp: new Date(),
      message,
      type
    }

    setEntries(prev => {
      const newEntries = [...prev, entry]
      // Keep only the last maxEntries
      if (newEntries.length > maxEntries) {
        return newEntries.slice(-maxEntries)
      }
      return newEntries
    })
  }, [maxEntries])

  const clear = useCallback(() => {
    setEntries([])
    idCounterRef.current = 0
  }, [])

  const addStdout = useCallback((message: string) => {
    addEntry(message, 'stdout')
  }, [addEntry])

  const addStderr = useCallback((message: string) => {
    addEntry(message, 'stderr')
  }, [addEntry])

  const addSuccess = useCallback((message: string) => {
    addEntry(message, 'success')
  }, [addEntry])

  const addError = useCallback((message: string) => {
    addEntry(message, 'error')
  }, [addEntry])

  return {
    entries,
    addEntry,
    addStdout,
    addStderr,
    addSuccess,
    addError,
    clear
  }
}
