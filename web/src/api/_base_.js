import axios from "axios"

export const apiInstance = axios.create({
    baseURL:
        import.meta.env.VITE_ENV === 'development'
            ? import.meta.env.VITE_SERVER_LOCAL
            : import.meta.env.VITE_SERVER_PRODUCTION,
    withCredentials: true,
})