// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import { TbLoader, TbCube, TbAlertCircle, TbCheck } from 'react-icons/tb'

interface AutoDependencyDetectorProps {
  code: string
  onDependenciesDetected: (deps: string[]) => void
  loading?: boolean
  detectedDependencies?: string[]
}

interface DependencyDetectionResult {
  dependencies: string[]
  count: number
  language: string
}

const AutoDependencyDetector: FC<AutoDependencyDetectorProps> = ({
  code,
  onDependenciesDetected,
  loading: externalLoading = false,
  detectedDependencies: externalDeps
}) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const [detectedDependencies, setDetectedDependencies] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState('')

  const loading = externalLoading || internalLoading
  const dependencies = externalDeps || detectedDependencies

  const detectDependencies = useCallback(async (sourceCode: string) => {
    if (!sourceCode.trim() || sourceCode === lastAnalyzedCode) {
      return
    }

    setInternalLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/detect-dependencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sourceCode,
          language: 'python'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: DependencyDetectionResult = await response.json()
      
      setDetectedDependencies(result.dependencies)
      setLastAnalyzedCode(sourceCode)
      onDependenciesDetected(result.dependencies)
    } catch (err) {
      console.error('Dependency detection failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to detect dependencies')
      
      // Fallback: Basic regex-based detection for Python imports
      const fallbackDeps = extractPythonImports(sourceCode)
      setDetectedDependencies(fallbackDeps)
      onDependenciesDetected(fallbackDeps)
    } finally {
      setInternalLoading(false)
    }
  }, [lastAnalyzedCode, onDependenciesDetected])

  // Extract Python imports using regex as fallback
  const extractPythonImports = (sourceCode: string): string[] => {
    const imports = new Set<string>()

    // First, remove comments and multi-line strings to avoid false positives
    const cleanedCode = removeCommentsAndStrings(sourceCode)

    // Smart regex patterns for Python imports (only on cleaned code)
    const patterns = [
      // import xxx or import xxx as yyy
      /^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)(?:\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*)?\s*$/gm,
      // from xxx import yyy
      /^\s*from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import\s+(?:\*|\(?:(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*\))?\s*$/gm
    ]

    patterns.forEach(pattern => {
      const matches = cleanedCode.matchAll(pattern)
      for (const match of matches) {
        const importPath = match[1]
        // Get the top-level package name (e.g., "sdv.vdb.reply" -> "sdv")
        const packageName = importPath.split('.')[0].toLowerCase()

        // Filter out standard library modules and local modules
        if (!isStandardLibraryModule(packageName) && !isLocalModule(importPath, cleanedCode)) {
          imports.add(packageName)
        }
      }
    })

    return Array.from(imports).sort()
  }

  // Remove Python comments and strings to avoid false positive matches
  const removeCommentsAndStrings = (sourceCode: string): string => {
    let result = sourceCode

    // Remove multi-line strings ('''...''' and """..."""")
    result = result.replace(/'''[\s\S]*?'''/g, '')
    result = result.replace(/"""[\s\S]*?"""/g, '')

    // Remove single-line comments (# comment)
    result = result.replace(/#.*$/gm, '')

    // Remove regular strings (single and double quoted)
    // This prevents matching words inside strings
    result = result.replace(/'[^']*'/g, "''")
    result = result.replace(/"[^"]*"/g, '""')

    return result
  }

  const isStandardLibraryModule = (moduleName: string): boolean => {
    const standardLibModules = [
      'os', 'sys', 'time', 'datetime', 'json', 'csv', 're', 'math', 'random',
      'collections', 'itertools', 'functools', 'operator', 'pathlib', 'urllib',
      'http', 'socket', 'threading', 'multiprocessing', 'asyncio', 'logging',
      'unittest', 'argparse', 'configparser', 'sqlite3', 'pickle', 'base64',
      'hashlib', 'hmac', 'uuid', 'decimal', 'fractions', 'statistics', 'typing',
      'dataclasses', 'enum', 'contextlib', 'abc', 'inspect', 'importlib'
    ]
    return standardLibModules.includes(moduleName)
  }

  const isLocalModule = (importPath: string, sourceCode: string): boolean => {
    // Check for relative imports (from . import xxx, from .. import xxx)
    const relativeImportPattern = /^\s*from\s+\.\.?\s+import/
    if (relativeImportPattern.test(sourceCode)) {
      return true
    }

    // Check if the import is from a local module (starts with dot in from statement)
    const lines = sourceCode.split('\n')
    for (const line of lines) {
      if (line.includes(`from ${importPath}`)) {
        // Check if it's a relative import
        if (/^\s*from\s+\.\.?\s*(?:\w+)?\s+import/.test(line)) {
          return true
        }
      }
    }

    return false
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (code.trim()) {
        detectDependencies(code)
      } else {
        setDetectedDependencies([])
        onDependenciesDetected([])
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [code, detectDependencies, onDependenciesDetected])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TbLoader className="w-4 h-4 animate-spin" />
            <span>Detecting Dependencies</span>
          </CardTitle>
          <CardDescription>
            Analyzing code for package dependencies...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <TbLoader className="w-4 h-4 animate-spin" />
            <span>Scanning import statements...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-600">
            <TbAlertCircle className="w-4 h-4" />
            <span>Dependency Detection</span>
          </CardTitle>
          <CardDescription>
            Auto-detection encountered an error, using fallback analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-yellow-600">Warning: {error}</p>
            <p className="text-sm text-muted-foreground">
              Using basic import analysis. Dependencies may need manual verification.
            </p>
            {dependencies.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Detected dependencies:</p>
                <div className="flex flex-wrap gap-1">
                  {dependencies.map(dep => (
                    <Badge key={dep} variant="outline" className="text-xs">
                      <TbAlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (dependencies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TbCube className="w-4 h-4" />
            <span>Dependencies</span>
          </CardTitle>
          <CardDescription>
            No external dependencies detected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your code doesn't appear to use any external packages that need to be installed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-600">
          <TbCheck className="w-4 h-4" />
          <span>Auto-Detected Dependencies</span>
        </CardTitle>
        <CardDescription>
          Found {dependencies.length} package{dependencies.length !== 1 ? 's' : ''} that will be automatically installed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {dependencies.map(dep => (
              <Badge key={dep} variant="secondary" className="flex items-center space-x-1">
                <TbCube className="w-3 h-3" />
                <span>{dep}</span>
              </Badge>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            <p>These packages will be automatically installed during deployment.</p>
            <p className="mt-1">You can add additional dependencies manually if needed.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AutoDependencyDetector