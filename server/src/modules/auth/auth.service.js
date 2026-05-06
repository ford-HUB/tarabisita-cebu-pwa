import { sendBrevoEmail } from "../../configs/nodemailer.js";

export const sendMailer = async (to, subject, html) => {
    const message = await sendBrevoEmail({
        to,
        subject,
        html
    })

    return message
}


export const sendMailerWithAttachments = async (to, subject, html, attachments = []) => {
    const message = await sendBrevoEmail({
        to,
        subject,
        html,
        attachments
    })

    return message
}