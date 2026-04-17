
export const roleBasedRoute = (role) => {
    switch (role) {
        case 'TOURIST':
            return 'explore'
        case 'BUSINESS':
            return 'dashboard'
        default :
            return 'route no longer exist'
    }
}