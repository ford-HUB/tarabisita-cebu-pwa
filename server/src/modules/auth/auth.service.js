import { transporter } from "../../configs/nodemailer.js";

export const sendMailer = async (to, subject, html) => {
    const message = await transporter.sendMail({
        from: process.env.EMAIL_USER || process.env.BREVO_LOGIN,
        to,
        subject,
        html
    })
    return message
}


export const sendMailerWithAttachments = async (to, subject, html, attachments = []) => {
    const normalized = (attachments || [])
        .filter((a) => a && a.filename && a.content)
        .map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType || undefined
        }))

    const message = await transporter.sendMail({
        from: process.env.EMAIL_USER || process.env.BREVO_LOGIN,
        to,
        subject,
        html,
        ...(normalized.length ? { attachments: normalized } : {})
    })

    return message
}