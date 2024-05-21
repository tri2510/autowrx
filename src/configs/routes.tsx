import RootLayout from '@/layouts/RootLayout'
import { Home } from '@/pages/home'
import { RouteObject } from 'react-router-dom'

const routesConfig: RouteObject[] = [
    {
        path: '/',
        element: <RootLayout />,
        children: [{ index: true, element: <Home /> }],
    },
]

export default routesConfig
