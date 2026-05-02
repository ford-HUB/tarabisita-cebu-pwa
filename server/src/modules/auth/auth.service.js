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

/**
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {{ filename: string, content: Buffer, contentType?: string }[]} attachments
 */
export const sendMailerWithAttachments = async (to, subject, html, attachments = []) => {
    const normalized = (attachments || [])
        .filter((a) => a && a.filename && a.content)
        .map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType || undefined
        }))

    const message = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        ...(normalized.length ? { attachments: normalized } : {})
    })

    return message
}