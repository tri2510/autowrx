import { lazy } from 'react'
import RootLayout from '@/layouts/RootLayout'
import SuspenseProvider from '@/providers/SuspenseProvider'
import { RouteConfig } from '@/types/common.type'
import PageAuthSuccess from '@/pages/PageAuthSuccess'
import { retry } from '@/lib/retry'

const PageHome = lazy(() => retry(() => import('@/pages/PageHome')))
const PageAbout = lazy(() => retry(() => import('@/pages/PageAbout')))
const PageModelList = lazy(() => retry(() => import('@/pages/PageModelList')))
const ModelDetailLayout = lazy(() =>
  retry(() => import('@/layouts/ModelDetailLayout')),
)
const PageModelDetail = lazy(() =>
  retry(() => import('@/pages/PageModelDetail')),
)
const PageModelArchitecture = lazy(
  () => import('@/pages/PageModelArchitecture'),
)
const PageVehicleApi = lazy(() => retry(() => import('@/pages/PageVehicleApi')))
const PagePrototypeDetail = lazy(() =>
  retry(() => import('@/pages/PagePrototypeDetail')),
)
const PageComponent = lazy(() =>
  retry(() => import('@/pages/test-ui/PageComponent')),
)
const PageMolecules = lazy(() =>
  retry(() => import('@/pages/test-ui/PageMolecules')),
)
const PageOrganisms = lazy(() =>
  retry(() => import('@/pages/test-ui/PageOrganisms')),
)
const PageTestHome = lazy(() =>
  retry(() => import('@/pages/test-ui/PageTestHome')),
)
const PageTestForm = lazy(() =>
  retry(() => import('@/pages/test-ui/PageTestForm')),
)
const PagePrototypeLibrary = lazy(() =>
  retry(() => import('@/pages/PagePrototypeLibrary')),
)
const PageResetPassword = lazy(() =>
  retry(() => import('@/pages/PageResetPassword')),
)
const PageManageUsers = lazy(() =>
  retry(() => import('@/pages/PageManageUsers')),
)
const PageDiscussions = lazy(() =>
  retry(() => import('@/pages/test-ui/PageDiscussions')),
)
const PageUserProfile = lazy(() =>
  retry(() => import('@/pages/PageUserProfile')),
)
const PageMyAssets = lazy(() => retry(() => import('@/pages/PageMyAssets')))
const PageManageFeatures = lazy(() =>
  retry(() => import('@/pages/PageManageFeatures')),
)
const PageGenAIWizard = lazy(() =>
  retry(() => import('@/pages/wizard/PageGenAIWizard')),
)
const PagePrivacyPolicy = lazy(() =>
  retry(() => import('@/pages/PagePrivacyPolicy')),
)
const PageInventory = lazy(() => retry(() => import('@/pages/PageInventory')))
const PageNewInventoryItem = lazy(() =>
  retry(() => import('@/pages/PageNewInventoryItem')),
)
const PageInventoryItemDetail = lazy(() =>
  retry(() => import('@/pages/PageInventoryItemDetail')),
)
const PageInventoryItemList = lazy(() =>
  retry(() => import('@/pages/PageInventoryItemList')),
)
const InventorySchemaList = lazy(() =>
  retry(
    () => import('@/components/molecules/inventory/schema/InventorySchemaList'),
  ),
)
const InventorySchemaCreate = lazy(() =>
  retry(
    () =>
      import('@/components/molecules/inventory/schema/InventorySchemaCreate'),
  ),
)
const InventorySchemaDetail = lazy(() =>
  retry(
    () =>
      import('@/components/molecules/inventory/schema/InventorySchemaDetail'),
  ),
)
const InventorySchemaUpdate = lazy(() =>
  retry(
    () =>
      import('@/components/molecules/inventory/schema/InventorySchemaUpdate'),
  ),
)
const InventoryInstanceCreate = lazy(() =>
  retry(
    () =>
      import(
        '@/components/molecules/inventory/instance/InventoryInstanceCreate'
      ),
  ),
)
const InventoryInstanceList = lazy(() =>
  retry(
    () =>
      import('@/components/molecules/inventory/instance/InventoryInstanceList'),
  ),
)
const InventoryInstanceDetail = lazy(() =>
  retry(
    () =>
      import(
        '@/components/molecules/inventory/instance/InventoryInstanceDetail'
      ),
  ),
)
const InventoryInstanceUpdate = lazy(() =>
  retry(
    () =>
      import(
        '@/components/molecules/inventory/instance/InventoryInstanceUpdate'
      ),
  ),
)

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
                <PageHome />
              </SuspenseProvider>
            ),
            noBreadcrumbs: true,
          },
          {
            path: 'manage-users',
            element: (
              <SuspenseProvider>
                <PageManageUsers />
              </SuspenseProvider>
            ),
            noBreadcrumbs: true,
          },
          {
            path: 'manage-features',
            element: (
              <SuspenseProvider>
                <PageManageFeatures />
              </SuspenseProvider>
            ),
            noBreadcrumbs: true,
          },
        ],
      },
      {
        path: '/about',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageAbout />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/reset-password',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageResetPassword />
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
                <ModelDetailLayout />
              </SuspenseProvider>
            ),
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <PageModelDetail />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'api',
                element: (
                  <SuspenseProvider>
                    <PageVehicleApi />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'api/:api',
                element: (
                  <SuspenseProvider>
                    <PageVehicleApi />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'library',
                element: (
                  <SuspenseProvider>
                    <PagePrototypeLibrary />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'library/:tab',
                element: (
                  <SuspenseProvider>
                    <PagePrototypeLibrary />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'library/:tab/:prototype_id',
                element: (
                  <SuspenseProvider>
                    <PagePrototypeLibrary />
                  </SuspenseProvider>
                ),
              },

              {
                path: 'architecture',
                element: (
                  <SuspenseProvider>
                    <PageModelArchitecture />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          {
            path: ':model_id/library/prototype/:prototype_id',
            element: (
              <SuspenseProvider>
                <PagePrototypeDetail />
              </SuspenseProvider>
            ),
          },
          {
            path: ':model_id/library/prototype/:prototype_id/:tab',
            element: (
              <SuspenseProvider>
                <PagePrototypeDetail />
              </SuspenseProvider>
            ),
          },
        ],
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
        path: '/inventory',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageInventory />
              </SuspenseProvider>
            ),
          },
          {
            path: 'new',
            element: (
              <SuspenseProvider>
                <PageNewInventoryItem />
              </SuspenseProvider>
            ),
          },
          {
            path: 'role/:inventory_role',
            children: [
              {
                index: true,
                element: (
                  <SuspenseProvider>
                    <PageInventoryItemList />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'item/:inventory_id',
                element: (
                  <SuspenseProvider>
                    <PageInventoryItemDetail />
                  </SuspenseProvider>
                ),
              },
              {
                path: 'item/:inventory_id/:tab',
                element: (
                  <SuspenseProvider>
                    <PageInventoryItemDetail />
                  </SuspenseProvider>
                ),
              },
            ],
          },
          {
            path: 'schema',
            element: (
              <SuspenseProvider>
                <InventorySchemaList />
              </SuspenseProvider>
            ),
          },
          {
            path: 'schema/new',
            element: (
              <SuspenseProvider>
                <InventorySchemaCreate />
              </SuspenseProvider>
            ),
          },
          {
            path: 'schema/:schemaId',
            element: (
              <SuspenseProvider>
                <InventorySchemaDetail />
              </SuspenseProvider>
            ),
          },
          {
            path: 'schema/:schemaId/edit',
            element: (
              <SuspenseProvider>
                <InventorySchemaUpdate />
              </SuspenseProvider>
            ),
          },
          {
            path: 'instance',
            element: (
              <SuspenseProvider>
                <InventoryInstanceList />
              </SuspenseProvider>
            ),
          },
          {
            path: 'instance/new',
            element: (
              <SuspenseProvider>
                <InventoryInstanceCreate />
              </SuspenseProvider>
            ),
          },
          {
            path: 'instance/:instanceId',
            element: (
              <SuspenseProvider>
                <InventoryInstanceDetail />
              </SuspenseProvider>
            ),
          },
          {
            path: 'instance/:instanceId/edit',
            element: (
              <SuspenseProvider>
                <InventoryInstanceUpdate />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/genai-wizard',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PageGenAIWizard />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/privacy-policy',
        children: [
          {
            index: true,
            element: (
              <SuspenseProvider>
                <PagePrivacyPolicy />
              </SuspenseProvider>
            ),
          },
        ],
      },
      {
        path: '/auth/:provider/success',
        element: <PageAuthSuccess />,
      },
      ...(!process.env.NODE_ENV || process.env.NODE_ENV === 'development'
        ? [
            {
              path: '/test-ui/forms',
              children: [
                {
                  index: true,
                  element: (
                    <SuspenseProvider>
                      <PageTestForm />
                    </SuspenseProvider>
                  ),
                },
              ],
            },
            {
              path: '/test-ui/home',
              children: [
                {
                  index: true,
                  element: (
                    <SuspenseProvider>
                      <PageTestHome />
                    </SuspenseProvider>
                  ),
                },
              ],
            },
            {
              path: '/test-ui/components',
              children: [
                {
                  index: true,
                  element: (
                    <SuspenseProvider>
                      <PageComponent />
                    </SuspenseProvider>
                  ),
                },
              ],
            },
            {
              path: '/test-ui/molecules',
              children: [
                {
                  index: true,
                  element: (
                    <SuspenseProvider>
                      <PageMolecules />
                    </SuspenseProvider>
                  ),
                },
              ],
            },
            {
              path: '/test-ui/organisms',
              children: [
                {
                  index: true,
                  element: (
                    <SuspenseProvider>
                      <PageOrganisms />
                    </SuspenseProvider>
                  ),
                },
              ],
            },
            {
              path: '/test-ui/discussion',
              children: [
                {
                  index: true,
                  element: (
                    <SuspenseProvider>
                      <PageDiscussions />
                    </SuspenseProvider>
                  ),
                },
              ],
            },
          ]
        : []),
    ],
  },
]

export default routesConfig
