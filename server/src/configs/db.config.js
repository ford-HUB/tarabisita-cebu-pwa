import mongoose from 'mongoose'

export const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL)
        console.log('Database connected')
    } catch (error) {
        console.error('Database failed to connect: ', error.message)
    }
}