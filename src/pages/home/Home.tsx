import { Button } from '@/components/ui/button'
import { loginService } from '@/services/auth.service'
import useAuthStore from '@/stores/useAuthStore'
import { isAxiosError } from 'axios'
import { useState } from 'react'

const Home = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const setAccess = useAuthStore((state) => state.setAccess)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await loginService(username, password)
            setAccess(response.data.tokens.access)
        } catch (error) {
            if (isAxiosError(error)) {
                console.error(error.response?.data.message || 'An error occurred')
            } else {
                console.error('An error occurred')
            }
        }
    }

    return (
        <div className='p-4'>
            <form onSubmit={handleSubmit}>
                <label htmlFor='username' className='block'>
                    Username
                </label>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    id='username'
                    className='border'
                />
                <label htmlFor='username' className='block'>
                    Password
                </label>
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id='password'
                    type='password'
                    className='border'
                />
                <br />
                <Button className='w-40 mt-5'>Login</Button>
            </form>
        </div>
    )
}

export default Home
