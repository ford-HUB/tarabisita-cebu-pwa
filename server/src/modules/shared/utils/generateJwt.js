import jwt from 'jsonwebtoken'

export const generateAccessToken = (user, res) => {
    const token = jwt.sign({ _id: user._id, email: user.email },
        process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie('accessToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return token
}

export const generateRefreshToken = (user, res) => {
    const token = jwt.sign({ _id: user._id, email: user.email },
        process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return token
}