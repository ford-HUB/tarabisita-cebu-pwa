import { transporter } from "../../configs/nodemailer.js";
import { templateReader } from "../shared/utils/templateReaderExtractor.js";

export const sendMailer = async (to, subject, html) => {
    try {
        const message = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        })

        return console.log(message.response)
    } catch (error) {
        throw error
    }
}