import jwt from 'jsonwebtoken'
import User from '../../auth/User.model.js'

export const guard = ([...roles]) => {
    return async (req, res, next) => {
        try {
            const token = req.cookies.accessToken
            if (!token) {
                return res.status(401).json({ message: "Unauthorized" })
            }

            const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
            const user = await User.findById(decodedToken._id).populate('roleId').select('-password')
            if (!user) {
                return res.status(404).json({ message: "User not found" })
            }

            if (roles && !roles.includes(user.roleId.name)) {
                return res.status(403).json({ message: "Forbidden" })
            }

            req.user = user
            next()
        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    }
}