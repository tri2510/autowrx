import { serverAxios } from './base'

export const loginService = async (email: string, password: string) => {
    return (await serverAxios.post('/auth/login', { email, password })).data
}

export const logoutService = async () => {
    return serverAxios.post('/auth/logout')
}
