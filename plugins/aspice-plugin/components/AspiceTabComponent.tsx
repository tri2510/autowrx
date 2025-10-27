// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react'
import { AutoWRXPluginAPI, VehicleData } from '../../../frontend/src/types/plugin.types'

declare global {
  interface Window {
    AutoWRXPluginAPI: AutoWRXPluginAPI
  }
}

interface AssessmentData {
  processArea?: string
  capabilityLevel?: string
  notes?: string
  vehicleModel?: string
  vehiclePrototype?: string
  assessmentDate?: string
}

const AspiceTabComponent: React.FC = () => {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({})
  const [isLoading, setIsLoading] = useState(false)
  const api = window.AutoWRXPluginAPI

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = api.getVehicleData()
      setVehicleData(data)

      const saved = await api.getStorage('assessment-data')
      setAssessmentData(saved || {})
    } catch (error) {
      console.error('Failed to load data:', error)
      api.showToast('Failed to load assessment data', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveAssessmentData = async (data: AssessmentData) => {
    try {
      const dataWithTimestamp = {
        ...data,
        assessmentDate: new Date().toISOString()
      }
      await api.setStorage('assessment-data', dataWithTimestamp)
      setAssessmentData(dataWithTimestamp)
      api.showToast('Assessment data saved successfully', 'success')
    } catch (error) {
      api.showToast('Failed to save assessment data', 'error')
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: AssessmentData = {
      processArea: formData.get('processArea') as string,
      capabilityLevel: formData.get('capabilityLevel') as string,
      notes: formData.get('notes') as string,
      vehicleModel: formData.get('vehicleModel') as string,
      vehiclePrototype: formData.get('vehiclePrototype') as string
    }
    saveAssessmentData(data)
  }

  const processAreas = [
    { value: 'SYS.1', label: 'SYS.1 - System Requirements Analysis' },
    { value: 'SYS.2', label: 'SYS.2 - System Architectural Design' },
    { value: 'SYS.3', label: 'SYS.3 - System Detailed Design' },
    { value: 'SYS.4', label: 'SYS.4 - System Integration and Integration Test' },
    { value: 'SYS.5', label: 'SYS.5 - System Qualification Test' },
    { value: 'SWE.1', label: 'SWE.1 - Software Requirements Analysis' },
    { value: 'SWE.2', label: 'SWE.2 - Software Architectural Design' },
    { value: 'SWE.3', label: 'SWE.3 - Software Detailed Design and Unit Construction' },
    { value: 'SWE.4', label: 'SWE.4 - Software Unit Verification' },
    { value: 'SWE.5', label: 'SWE.5 - Software Integration and Integration Test' },
    { value: 'SWE.6', label: 'SWE.6 - Software Qualification Test' }
  ]

  const capabilityLevels = [
    { value: '0', label: 'Level 0 - Incomplete' },
    { value: '1', label: 'Level 1 - Performed' },
    { value: '2', label: 'Level 2 - Managed' },
    { value: '3', label: 'Level 3 - Established' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading ASPICE assessment...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ASPICE Assessment</h1>
        <p className="text-gray-600">
          Automotive SPICE (Software Process Improvement and Capability dEtermination) assessment tool
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Information Panel */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Vehicle Information</h2>
          {vehicleData ? (
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Model:</span>
                <span className="ml-2 text-gray-900">
                  {vehicleData.model?.name || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Available APIs:</span>
                <span className="ml-2 text-gray-900">{vehicleData.apis.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Active Signals:</span>
                <span className="ml-2 text-gray-900">
                  {Object.keys(vehicleData.signals).length}
                </span>
              </div>
              {vehicleData.model?.version && (
                <div>
                  <span className="font-medium text-gray-700">Version:</span>
                  <span className="ml-2 text-gray-900">{vehicleData.model.version}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No vehicle data available</p>
          )}

          {assessmentData.assessmentDate && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="font-medium text-gray-700">Last Assessment:</span>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(assessmentData.assessmentDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Assessment Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Assessment Form</h2>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={assessmentData.vehicleModel || vehicleData?.model?.name || ''}
                  placeholder="Enter vehicle model"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prototype/Version
                </label>
                <input
                  type="text"
                  name="vehiclePrototype"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={assessmentData.vehiclePrototype || ''}
                  placeholder="Enter prototype data"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Process Area
              </label>
              <select 
                name="processArea" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={assessmentData.processArea || ''}
                required
              >
                <option value="">Select Process Area</option>
                {processAreas.map(area => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capability Level
              </label>
              <select 
                name="capabilityLevel" 
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={assessmentData.capabilityLevel || ''}
                required
              >
                <option value="">Select Capability Level</option>
                {capabilityLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Notes
              </label>
              <textarea 
                name="notes"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                defaultValue={assessmentData.notes || ''}
                placeholder="Enter detailed assessment notes, findings, recommendations, and evidence..."
              />
            </div>

            <div className="flex space-x-4">
              <button 
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Assessment
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all assessment data?')) {
                    setAssessmentData({})
                    api.setStorage('assessment-data', {})
                    api.showToast('Assessment data cleared', 'info')
                  }
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AspiceTabComponent