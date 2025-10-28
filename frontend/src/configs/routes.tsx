// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { lazy } from 'react'
import RootLayout from '@/layouts/RootLayout'
import SuspenseProvider from '@/providers/SuspenseProvider'
import { RouteConfig } from '@/types/common.type.ts'
import PageUserProfile from '@/pages/PageUserProfile.tsx'
import PageMyAssets from '@/pages/PageMyAssets.tsx'
import PageNotFound from '@/pages/PageNotFound.tsx'
import SiteConfigManagement from '@/pages/SiteConfigManagement.tsx'
import PluginDemo from '@/pages/PluginDemo.tsx'
import ExtensionCenter from '@/pages/ExtensionCenter'
import { retry } from '@/lib/retry.ts'

// Real AutoWRX Pages
const PageModelList = lazy(() => retry(() => import('@/pages/PageModelList')))
const PageModelDetail = lazy(() => retry(() => import('@/pages/PageModelDetail')))
// const PageModelArchitecture = lazy(
//   () => import('@/pages/PageModelArchitecture'),
// )
// const PageVehicleApi = lazy(() => retry(() => import('@/pages/PageVehicleApi')))
// const PagePrototypeDetail = lazy(() =>
//   retry(() => import('@/pages/PagePrototypeDetail')),
// )
// const PageComponent = lazy(() =>
//   retry(() => import('@/pages/test-ui/PageComponent')),
// )
// const PageMolecules = lazy(() =>
//   retry(() => import('@/pages/test-ui/PageMolecules')),
// )
// const PageOrganisms = lazy(() =>
//   retry(() => import('@/pages/test-ui/PageOrganisms')),
// )
// const PageTestHome = lazy(() =>
//   retry(() => import('@/pages/test-ui/PageTestHome')),
// )
// const PageTestForm = lazy(() =>
//   retry(() => import('@/pages/test-ui/PageTestForm')),
// )
// const PagePrototypeLibrary = lazy(() =>
//   retry(() => import('@/pages/PagePrototypeLibrary')),
// )
// const PageTestM89 = lazy(() =>
//   retry(() => import('@/pages/TestM89')),
// )
// const PageResetPassword = lazy(() =>
//   retry(() => import('@/pages/PageResetPassword')),
// )
// const PageManageUsers = lazy(() =>
//   retry(() => import('@/pages/PageManageUsers')),
// )
// const PageDiscussions = lazy(() =>
//   retry(() => import('@/pages/test-ui/PageDiscussions')),
// )
// const PageProjectEditor = lazy(() =>
//   retry(() => import('@/pages/test-ui/PageProjectEditor')),
// )



// const PageManageFeatures = lazy(() =>
//   retry(() => import('@/pages/PageManageFeatures')),
// )
// const PageGenAIWizard = lazy(() =>
//   retry(() => import('@/pages/wizard/PageGenAIWizard')),
// )
// const PagePrivacyPolicy = lazy(() =>
//   retry(() => import('@/pages/PagePrivacyPolicy')),
// )
// const PageInventory = lazy(() => retry(() => import('@/pages/PageInventory')))
// const PageNewInventoryItem = lazy(() =>
//   retry(() => import('@/pages/PageNewInventoryItem')),
// )
// const PageInventoryItemDetail = lazy(() =>
//   retry(() => import('@/pages/PageInventoryItemDetail')),
// )
// const PageInventoryItemList = lazy(() =>
//   retry(() => import('@/pages/PageInventoryItemList')),
// )

const routesConfig: RouteConfig[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/',
        noBreadcrumbs: true,
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <div className='flex flex-col items-center justify-center h-screen w-full bg-gradient-to-br from-blue-500 to-purple-600 text-white'>
                  <div className='text-4xl font-bold mb-4'>🚀 AutoWRX</div>
                  <div className='text-xl mb-8'>Software Defined Vehicle Platform</div>
                  <div className='space-y-4'>
                    <a 
                      href='/model' 
                      className='block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors'
                    >
                      🚗 Browse Vehicle Models
                    </a>
                    <a 
                      href='/plugin-demo' 
                      className='block bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors'
                    >
                      🔌 Plugin System Demo
                    </a>
                    <a
                      href='/extensions'
                      className='block bg-slate-900/60 border border-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition-colors'
                    >
                      🧩 Extension Center
                    </a>
                    <div className='text-center text-blue-100 text-sm'>
                      Full plugin system integrated with vehicle models
                    </div>
                  </div>
                </div>
              </SuspenseProvider>
            ),
            noBreadcrumbs: true,
          },
          {
            path: '/profile',
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <PageUserProfile />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          {
            path: '/my-assets',
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <PageMyAssets />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          {
            path: '/site-config',
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <SiteConfigManagement />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          {
            path: '/plugin-demo',
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <PluginDemo />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          {
            path: '/extensions',
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <ExtensionCenter />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          {
            path: '/model',
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <PageModelList />
                  </SuspenseProvider>
                ),
              },
              {
                path: ':model_id',
                element: (
                  <SuspenseProvider>
                    <PageModelDetail />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          // {
          //   path: 'manage-users',
          //   element: (
          //     <SuspenseProvider>
          //       <PageManageUsers />
          //     </SuspenseProvider>
          //   ),
          //   noBreadcrumbs: true,
          // },
          // {
          //   path: 'manage-features',
          //   element: (
          //     <SuspenseProvider>
          //       <PageManageFeatures />
          //     </SuspenseProvider>
          //   ),
          //   noBreadcrumbs: true,
          // },
        ],
      },
      // {
      //   path: '/reset-password',
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <SuspenseProvider>
      //           <PageResetPassword />
      //         </SuspenseProvider>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: '/model',
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <SuspenseProvider>
      //           <PageModelList />
      //         </SuspenseProvider>
      //       ),
      //     },
      //     {
      //       path: ':model_id',
      //       element: (
      //         <SuspenseProvider>
      //           <ModelDetailLayout />
      //         </SuspenseProvider>
      //       ),
      //       children: [
      //         {
      //           index: true,
      //           element: (
      //             <SuspenseProvider>
      //               <PageModelDetail />
      //             </SuspenseProvider>
      //           ),
      //         },
      //         {
      //           path: 'api',
      //           element: (
      //             <SuspenseProvider>
      //               <PageVehicleApi />
      //             </SuspenseProvider>
      //           ),
      //         },
      //         {
      //           path: 'api/:api',
      //           element: (
      //             <SuspenseProvider>
      //               <PageVehicleApi />
      //             </SuspenseProvider>
      //           ),
      //         },
      //         {
      //           path: 'library',
      //           element: (
      //             <SuspenseProvider>
      //               <PagePrototypeLibrary />
      //             </SuspenseProvider>
      //           ),
      //         },
      //         {
      //           path: 'library/:tab',
      //           element: (
      //             <SuspenseProvider>
      //               <PagePrototypeLibrary />
      //             </SuspenseProvider>
      //           ),
      //         },
      //         {
      //           path: 'library/:tab/:prototype_id',
      //           element: (
      //             <SuspenseProvider>
      //               <PagePrototypeLibrary />
      //             </SuspenseProvider>
      //           ),
      //         },

      //         {
      //           path: 'architecture',
      //           element: (
      //             <SuspenseProvider>
      //               <PageModelArchitecture />
      //             </SuspenseProvider>
      //           ),
      //         },
      //       ],
      //     },
      //     {
      //       path: ':model_id/library/prototype/:prototype_id',
      //       element: (
      //         <SuspenseProvider>
      //           <PagePrototypeDetail />
      //         </SuspenseProvider>
      //       ),
      //     },
      //     {
      //       path: ':model_id/library/prototype/:prototype_id/:tab',
      //       element: (
      //         <SuspenseProvider>
      //           <PagePrototypeDetail />
      //         </SuspenseProvider>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: '/genai-wizard',
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <SuspenseProvider>
      //           <PageGenAIWizard />
      //         </SuspenseProvider>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: '/privacy-policy',
      //   children: [
      //     {
      //       index: true,
      //       element: (
      //         <SuspenseProvider>
      //           <PagePrivacyPolicy />
      //         </SuspenseProvider>
      //       ),
      //     },
      //   ],
      // },
      // {
      //   path: '/auth/:provider/success',
      //   element: <PageAuthSuccess />,
      // },
      // {
      //   path: '/test-ui',
      //   element: (
      //     <SuspenseProvider>
      //       <PageTestM89 />
      //     </SuspenseProvider>
      //   ),
      // },
      // ...(!process.env.NODE_ENV || process.env.NODE_ENV === 'development'
      //   ? [
      //       {
      //         path: '/test-ui/forms',
      //         children: [
      //           {
      //             index: true,
      //             element: (
      //               <SuspenseProvider>
      //                 <PageTestForm />
      //               </SuspenseProvider>
      //             ),
      //           },
      //         ],
      //       },
      //       {
      //         path: '/test-ui/home',
      //         children: [
      //           {
      //             index: true,
      //             element: (
      //               <SuspenseProvider>
      //                 <PageTestHome />
      //               </SuspenseProvider>
      //             ),
      //           },
      //         ],
      //       },
      //       {
      //         path: '/test-ui/components',
      //         children: [
      //           {
      //             index: true,
      //             element: (
      //               <SuspenseProvider>
      //                 <PageComponent />
      //               </SuspenseProvider>
      //             ),
      //           },
      //         ],
      //       },
      //       {
      //         path: '/test-ui/molecules',
      //         children: [
      //           {
      //             index: true,
      //             element: (
      //               <SuspenseProvider>
      //                 <PageMolecules />
      //               </SuspenseProvider>
      //             ),
      //           },
      //         ],
      //       },
      //       {
      //         path: '/test-ui/organisms',
      //         children: [
      //           {
      //             index: true,
      //             element: (
      //               <SuspenseProvider>
      //                 <PageOrganisms />
      //               </SuspenseProvider>
      //             ),
      //           },
      //         ],
      //       },
      //       {
      //         path: '/test-ui/discussion',
      //         children: [
      //           {
      //             index: true,
      //             element: (
      //               <SuspenseProvider>
      //                 <PageDiscussions />
      //               </SuspenseProvider>
      //             ),
      //           },
      //         ],
      //       },
      //       {
      //         path: '/test-ui/project-editor',
      //         children: [
      //           {
      //             index: true,
      //             element: (
      //               <SuspenseProvider>
      //                 <PageProjectEditor />
      //               </SuspenseProvider>
      //             ),
      //           },
      //         ],
      //       },
      //     ]
      //   : []),
    ],
  },
  // Catch-all route for 404 pages
  {
    path: '*',
    element: <PageNotFound />,
  },
]

export default routesConfig
