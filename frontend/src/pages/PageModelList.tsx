// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React from 'react'
import { Link } from 'react-router-dom'

interface VehicleModel {
  id: string
  name: string
  version: string
  description: string
  image: string
  status: 'active' | 'development' | 'archived'
  language: string
}

const PageModelList: React.FC = () => {
  // Mock vehicle models (in real app, would come from API)
  const models: VehicleModel[] = [
    {
      id: 'bmw-x3-2024',
      name: 'BMW X3 2024',
      version: 'v2.1.0',
      description: 'BMW X3 Electric Vehicle Model with Advanced Driver Assistance',
      image: '/imgs/targets/target_3d_car.png',
      status: 'active',
      language: 'Python'
    },
    {
      id: 'mercedes-eqs',
      name: 'Mercedes EQS',
      version: 'v1.5.2',
      description: 'Mercedes EQS Luxury Electric Vehicle',
      image: '/imgs/targets/target_3d_car.png',
      status: 'active',
      language: 'Python'
    },
    {
      id: 'audi-etron-gt',
      name: 'Audi e-tron GT',
      version: 'v3.0.1',
      description: 'Audi e-tron GT Performance Vehicle',
      image: '/imgs/targets/target_3d_car.png',
      status: 'development',
      language: 'Python'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'development': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Models</h1>
        <p className="text-gray-600 mt-2">
          Select a vehicle model to start development with AutoWRX plugins
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map(model => (
          <Link
            key={model.id}
            to={`/model/${model.id}`}
            className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
          >
            <div className="p-6">
              {/* Model Image */}
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <img 
                  src={model.image} 
                  alt={model.name}
                  className="h-20 w-20 object-contain"
                />
              </div>

              {/* Model Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {model.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                    {model.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  {model.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Version: <span className="font-medium">{model.version}</span>
                  </span>
                  <span className="text-gray-500">
                    <span className="font-medium">{model.language}</span>
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>🔌 Plugin Ready</span>
                    <span>📊 SDV Compatible</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Add New Model Card */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-6 hover:border-gray-400 transition-colors">
          <div className="text-center">
            <div className="text-3xl text-gray-400 mb-2">+</div>
            <div className="text-sm text-gray-600 font-medium">Add New Model</div>
            <div className="text-xs text-gray-500 mt-1">Create or import</div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          🔌 Plugin System Ready
        </h2>
        <p className="text-blue-800 text-sm">
          Each vehicle model supports custom plugins. When you select a model, you'll see the standard tabs 
          (Journey, Flow, SDV Code, Dashboard, Homologation) plus any loaded plugins specific to that model.
        </p>
      </div>
    </div>
  )
}

export default PageModelList