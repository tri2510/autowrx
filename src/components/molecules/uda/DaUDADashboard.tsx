// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { FC } from 'react'
import { TbRocket, TbCloud, TbDeviceDesktop, TbSettings } from 'react-icons/tb'

interface DaUDADashboardProps {
  onClose?: () => void
}

const DaUDADashboard: FC<DaUDADashboardProps> = ({ onClose }) => {
  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto p-6 bg-da-white rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TbRocket className="w-8 h-8 text-da-primary-500" />
          <div>
            <h2 className="text-2xl font-bold text-da-gray-900">Universal Deployment Agent</h2>
            <p className="text-da-gray-600">Manage and monitor your deployments</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-da-gray-50 p-4 rounded-lg border border-da-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-da-gray-600">Active Deployments</p>
              <p className="text-2xl font-bold text-da-primary-600">3</p>
            </div>
            <TbCloud className="w-8 h-8 text-da-primary-400" />
          </div>
        </div>

        <div className="bg-da-gray-50 p-4 rounded-lg border border-da-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-da-gray-600">Connected Devices</p>
              <p className="text-2xl font-bold text-da-green-600">12</p>
            </div>
            <TbDeviceDesktop className="w-8 h-8 text-da-green-400" />
          </div>
        </div>

        <div className="bg-da-gray-50 p-4 rounded-lg border border-da-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-da-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-da-blue-600">98.5%</p>
            </div>
            <TbRocket className="w-8 h-8 text-da-blue-400" />
          </div>
        </div>

        <div className="bg-da-gray-50 p-4 rounded-lg border border-da-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-da-gray-600">System Status</p>
              <p className="text-2xl font-bold text-da-green-600">Healthy</p>
            </div>
            <TbSettings className="w-8 h-8 text-da-green-400" />
          </div>
        </div>
      </div>

      {/* Deployment List */}
      <div className="bg-white border border-da-gray-200 rounded-lg">
        <div className="p-4 border-b border-da-gray-200">
          <h3 className="text-lg font-semibold text-da-gray-900">Recent Deployments</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {/* Deployment Item 1 */}
            <div className="flex items-center justify-between p-3 bg-da-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-da-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-da-gray-900">Production Deploy</p>
                  <p className="text-sm text-da-gray-600">Vehicle Fleet A • 2 minutes ago</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-da-green-100 text-da-green-800 rounded-full">Success</span>
            </div>

            {/* Deployment Item 2 */}
            <div className="flex items-center justify-between p-3 bg-da-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-da-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-da-gray-900">Testing Environment</p>
                  <p className="text-sm text-da-gray-600">Development Cluster • 15 minutes ago</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-da-blue-100 text-da-blue-800 rounded-full">Deploying</span>
            </div>

            {/* Deployment Item 3 */}
            <div className="flex items-center justify-between p-3 bg-da-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-da-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-da-gray-900">Staging Update</p>
                  <p className="text-sm text-da-gray-600">Test Vehicles • 1 hour ago</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-da-yellow-100 text-da-yellow-800 rounded-full">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-da-gray-700 bg-da-gray-200 rounded-lg hover:bg-da-gray-300 transition-colors"
        >
          Close
        </button>
        <button className="px-4 py-2 text-white bg-da-primary-500 rounded-lg hover:bg-da-primary-600 transition-colors">
          View All Deployments
        </button>
      </div>
    </div>
  )
}

export default DaUDADashboard