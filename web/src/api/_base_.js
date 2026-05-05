import axios from "axios"

export const apiInstance = axios.create({
    baseURL: import.meta.env.VITE_ENV === 'production' ? import.meta.env.VITE_SERVER_PRODUCTION : import.meta.env.VITE_SERVER_LOCAL,
    withCredentials: true,
})