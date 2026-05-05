import jwt from 'jsonwebtoken'

const isProduction = process.env.NODE_ENV === 'production'

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
}

export const generateAccessToken = (user, res) => {
    const token = jwt.sign({ _id: user._id, email: user.email },
        process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie('accessToken', token, cookieOptions)

    return token
}

export const generateRefreshToken = (user, res) => {
    const token = jwt.sign({ _id: user._id, email: user.email },
        process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie('refreshToken', token, cookieOptions)

    return token
}
