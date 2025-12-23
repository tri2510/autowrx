// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC, useState, useCallback, useEffect, useRef } from 'react'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card'
import {
  TbCube,
  TbPlus,
  TbX,
  TbLoader,
  TbCheck,
  TbAlertCircle,
  TbRefresh,
  TbPackage,
  TbSearch,
  TbChevronDown,
  TbChevronRight
} from 'react-icons/tb'

interface Dependency {
  name: string
  version?: string
  source: 'detected' | 'manual' | 'suggested'
  isValid?: boolean
  errorMessage?: string
}

interface EnhancedDependencyManagerProps {
  detectedDependencies: string[]
  onDependenciesChange: (dependencies: string[]) => void
  disabled?: boolean
  fixedDependencies?: string[] // Fixed dependencies that are always included
  autoDetectEnabled?: boolean
  onToggleAutoDetect?: () => void
}

// Popular Python packages for suggestions
const POPULAR_PACKAGES = [
  'numpy', 'pandas', 'requests', 'scipy', 'matplotlib', 'seaborn',
  'scikit-learn', 'tensorflow', 'torch', 'fastapi', 'flask',
  'sqlalchemy', 'pillow', 'beautifulsoup4', 'selenium', 'pytest',
  'kuksa-client', 'canmatrix', 'python-can', 'opencv-python',
  'redis', 'pymongo', 'psycopg2-binary', 'celery', 'pydantic'
]

// Standard library modules to exclude
const STANDARD_LIBRARY = [
  'os', 'sys', 'time', 'datetime', 'json', 'csv', 're', 'math', 'random',
  'collections', 'itertools', 'functools', 'operator', 'pathlib', 'urllib',
  'http', 'socket', 'threading', 'multiprocessing', 'asyncio', 'logging',
  'unittest', 'argparse', 'configparser', 'sqlite3', 'pickle', 'base64',
  'hashlib', 'hmac', 'uuid', 'decimal', 'fractions', 'statistics', 'typing',
  'dataclasses', 'enum', 'contextlib', 'abc', 'inspect', 'importlib'
]

const EnhancedDependencyManager: FC<EnhancedDependencyManagerProps> = ({
  detectedDependencies,
  onDependenciesChange,
  disabled = false,
  fixedDependencies = ['kuksa_client==0.4.3', 'velocitas-sdk==0.14.1'],
  autoDetectEnabled = false,
  onToggleAutoDetect
}) => {
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [newDependency, setNewDependency] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [validatingPackages, setValidatingPackages] = useState<Set<string>>(new Set())
  const [packageValidation, setPackageValidation] = useState<Record<string, boolean>>({})
  const [isExpanded, setIsExpanded] = useState(false) // Default collapsed
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize detected dependencies
  useEffect(() => {
    const detected = detectedDependencies
      .filter(dep => !STANDARD_LIBRARY.includes(dep.toLowerCase()))
      .map(dep => ({
        name: dep,
        source: 'detected' as const,
        isValid: true
      }))

    setDependencies(prev => {
      const existingNames = prev.map(d => d.name)
      const newDeps = detected.filter(d => !existingNames.includes(d.name))
      return [...prev, ...newDeps]
    })
  }, [detectedDependencies])

  // Validate package name (basic check + optional PyPI lookup)
  const validatePackage = async (packageName: string): Promise<boolean> => {
    try {
      // Basic validation: check if it's a valid Python package name
      const isValidName = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(packageName)
      if (!isValidName) return false

      // Optional: Check if package exists on PyPI (for development, you might skip this)
      // For now, just do basic validation
      return true
    } catch (error) {
      console.warn('Package validation failed:', packageName, error)
      return false
    }
  }

  // Add dependency with validation
  const addDependency = useCallback(async (dependencyString: string) => {
    if (!dependencyString.trim()) return

    // Parse version specification (e.g., "numpy==1.2.3")
    const match = dependencyString.match(/^([^=<>!]+)([=<>!]+.+)?$/)
    if (!match) return

    const name = match[1].toLowerCase().trim()
    const versionSpec = match[2]?.trim()

    // Check if already exists
    if (dependencies.some(dep => dep.name === name)) {
      return
    }

    // Check if it's a standard library module
    if (STANDARD_LIBRARY.includes(name)) {
      return
    }

    // Create dependency object
    const newDep: Dependency = {
      name,
      version: versionSpec || undefined,
      source: 'manual',
      isValid: false // Will be updated after validation
    }

    // Add immediately for responsive UI
    setDependencies(prev => [...prev, newDep])
    setNewDependency('')
    setShowSuggestions(false)

    // Validate package asynchronously
    setValidatingPackages(prev => new Set(prev).add(name))
    try {
      const isValid = await validatePackage(name)
      setPackageValidation(prev => ({ ...prev, [name]: isValid }))
      setDependencies(prev => prev.map(dep =>
        dep.name === name ? { ...dep, isValid } : dep
      ))
    } catch (error) {
      console.warn('Validation failed for:', name)
      setDependencies(prev => prev.map(dep =>
        dep.name === name ? { ...dep, isValid: false, errorMessage: 'Validation failed' } : dep
      ))
    } finally {
      setValidatingPackages(prev => {
        const next = new Set(prev)
        next.delete(name)
        return next
      })
    }
  }, [dependencies])

  // Remove dependency
  const removeDependency = useCallback((name: string) => {
    setDependencies(prev => prev.filter(dep => dep.name !== name))
  }, [])

  // Get filtered suggestions
  const getSuggestions = () => {
    if (!newDependency.trim()) return []

    const existingNames = dependencies.map(d => d.name)
    return POPULAR_PACKAGES
      .filter(pkg =>
        pkg.toLowerCase().includes(newDependency.toLowerCase()) &&
        !existingNames.includes(pkg) &&
        !STANDARD_LIBRARY.includes(pkg.toLowerCase())
      )
      .slice(0, 6) // Limit suggestions
  }

  // Get dependencies for output (include detected + manual)
  const getAllDependencies = () => {
    return [
      ...detectedDependencies.filter(dep =>
        !dependencies.some(d => d.name === dep.toLowerCase())
      ),
      ...dependencies
        .filter(dep => dep.isValid !== false)
        .map(dep => dep.version ? `${dep.name}${dep.version}` : dep.name)
    ]
  }

  // Notify parent of dependency changes
  useEffect(() => {
    onDependenciesChange(getAllDependencies())
  }, [dependencies, detectedDependencies])

  const suggestions = getSuggestions()
  const hasInvalidDeps = dependencies.some(dep => dep.isValid === false)
  const isLoading = validatingPackages.size > 0

  return (
    <div className="space-y-3">
      {/* Fixed Dependencies - Always shown separately, small */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <TbCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                Required ({fixedDependencies.length})
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
            fixed
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {fixedDependencies.map(dep => (
            <Badge key={dep} variant="outline" className="text-xs bg-white dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
              {dep}
            </Badge>
          ))}
        </div>
      </div>

      {/* Final Summary - Always visible */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TbPackage className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs font-medium text-green-900 dark:text-green-100">
                Will be installed ({fixedDependencies.length + (autoDetectEnabled ? detectedDependencies.length : 0)} total)
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
            final
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {fixedDependencies.map(dep => (
            <Badge key={dep} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
              {dep}
            </Badge>
          ))}
          {autoDetectEnabled && detectedDependencies.map(dep => (
            <Badge key={dep} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
              {dep}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main Collapsible Card */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <TbPackage className="w-5 h-5" />
              <span>Dependencies Management</span>
              {isLoading && <TbLoader className="w-4 h-4 animate-spin text-blue-500" />}
              {hasInvalidDeps && <TbAlertCircle className="w-4 h-4 text-yellow-500" />}
              <span className="text-sm font-normal text-muted-foreground">
                ({dependencies.length} package{dependencies.length !== 1 ? 's' : ''})
              </span>
            </div>
            {isExpanded ? <TbChevronDown className="w-5 h-5" /> : <TbChevronRight className="w-5 h-5" />}
          </CardTitle>
          <CardDescription>
            Add Python packages to install. Detected dependencies are included automatically.
          </CardDescription>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4">
          {/* Auto-Detect Toggle */}
          <div className="flex items-center justify-between bg-muted rounded-md p-3">
            <div className="flex items-center space-x-2">
              <TbLoader className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Auto-detect from code</p>
                <p className="text-xs text-muted-foreground">
                  Automatically detect imports from your Python code
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant={autoDetectEnabled ? "default" : "outline"}
              size="sm"
              onClick={onToggleAutoDetect}
              disabled={disabled}
            >
              {autoDetectEnabled ? 'Enabled' : 'Enable'}
            </Button>
          </div>

          {/* Detected Dependencies - Show when enabled */}
          {autoDetectEnabled && detectedDependencies && detectedDependencies.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                <TbCheck className="w-3 h-3 text-green-500" />
                <span>Detected from code ({detectedDependencies.length})</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedDependencies.map(dep => (
                  <Badge
                    key={`detected-${dep}`}
                    variant="secondary"
                    className="flex items-center space-x-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                  >
                    <TbCheck className="w-3 h-3" />
                    <span>{dep}</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Remove from detected dependencies
                        const newDeps = detectedDependencies.filter(d => d !== dep)
                        onDependenciesChange(dependencies.map(d => d.name).filter(n => !newDeps.includes(n)))
                      }}
                      className="ml-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-0.5 transition-colors"
                      disabled={disabled}
                    >
                      <TbX className="w-3 h-3" />
                    </button>
                    <Badge variant="outline" className="text-xs ml-1">detected</Badge>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add Dependency Input */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Enter package name (e.g., numpy, requests==2.28.1)"
                value={newDependency}
                onChange={(e) => setNewDependency(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDependency(newDependency)
                  }
                }}
                disabled={disabled}
                className="pr-10"
              />
              <TbSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <Button
              type="button"
              onClick={() => addDependency(newDependency)}
              disabled={!newDependency.trim() || disabled}
            >
              <TbPlus className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="border border-border rounded-md bg-background shadow-md p-1 z-10">
              {suggestions.map(pkg => (
                <button
                  key={pkg}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-muted rounded-sm text-sm flex items-center space-x-2"
                  onClick={() => {
                    setNewDependency(pkg)
                    setShowSuggestions(false)
                    inputRef.current?.focus()
                  }}
                >
                  <TbCube className="w-3 h-3 text-muted-foreground" />
                  <span>{pkg}</span>
                  <Badge variant="outline" className="text-xs">suggested</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual Dependencies */}
        {dependencies && dependencies.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center space-x-1">
              <TbPlus className="w-3 h-3" />
              <span>Added Dependencies ({dependencies.length})</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {(dependencies || []).map(dep => (
                <Badge
                  key={dep.name}
                  variant={dep.isValid === false ? "destructive" : "outline"}
                  className={`flex items-center space-x-1 ${
                    dep.source === 'suggested' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                  }`}
                >
                  {validatingPackages.has(dep.name) ? (
                    <TbLoader className="w-3 h-3 animate-spin" />
                  ) : dep.isValid === false ? (
                    <TbAlertCircle className="w-3 h-3" />
                  ) : (
                    <TbCheck className="w-3 h-3 text-green-500" />
                  )}
                  <span>{dep.version ? `${dep.name}${dep.version}` : dep.name}</span>
                  <button
                    type="button"
                    onClick={() => removeDependency(dep.name)}
                    className="ml-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-0.5 transition-colors"
                    disabled={disabled}
                  >
                    <TbX className="w-3 h-3" />
                  </button>
                  {dep.source === 'suggested' && (
                    <Badge variant="outline" className="text-xs">suggested</Badge>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {hasInvalidDeps && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <TbAlertCircle className="inline w-3 h-3 mr-1" />
              Some dependencies may not be valid. Please check package names and ensure they exist on PyPI.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDependencies([])}
            disabled={!dependencies || dependencies.length === 0 || disabled}
          >
            Clear Manual
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Add some popular packages
              const popular = ['numpy', 'requests', 'pandas']
              popular.forEach(pkg => {
                if (!dependencies.some(d => d.name === pkg) && !detectedDependencies.includes(pkg)) {
                  addDependency(pkg)
                }
              })
            }}
            disabled={disabled}
          >
            Add Popular
          </Button>
        </div>
      </CardContent>
      )}
    </Card>
    </div>
  )
}

export default EnhancedDependencyManager