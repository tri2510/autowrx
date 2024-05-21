import { serverAxios } from './base'

export const loginService = async (email: string, password: string) => {
    return (await serverAxios.post('/auth/login', { email, password })).data
}
;[
    /localhost:\\d+/,
    /\\.digitalauto\\.tech$/,
    /\\.digitalauto\\.asia$/,
    /\\.digital\\.auto$/,
    'https://digitalauto.netlify.app',
]
