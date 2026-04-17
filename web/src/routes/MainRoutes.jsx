import { BusinessRoutes } from "./business/BusinessRoutes"
import { AuthRoutes } from "./public/AuthRoutes"
import { TouristRoutes } from "./tourist/TouristRoutes"

export const MainRoutes = [
    ...AuthRoutes,
    ...TouristRoutes,
    ...BusinessRoutes
]