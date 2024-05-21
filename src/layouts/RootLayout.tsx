import useSelfProfileQuery from '@/hooks/useSelfProfile'
import { Outlet } from 'react-router-dom'

const RootLayout = () => {
    useSelfProfileQuery()
    return <Outlet />
}

export default RootLayout
