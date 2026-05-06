import nodemailer from 'nodemailer'
import 'dotenv/config'

export const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_LOGIN,
        pass: process.env.BREVO_APIKEY
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
})