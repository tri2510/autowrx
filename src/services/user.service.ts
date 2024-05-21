import { serverAxios } from './base'

export const getSelfService = async () => {
    return (await serverAxios.get('/users/self')).data
}
