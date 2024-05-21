import config from '@/configs/config'
import axios from 'axios'

export const serverAxios = axios.create({
    baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
    withCredentials: true,
})
