import { sendEmail } from "../../shared/utils/send-email.js";

export const sendMailer = async (to, subject, html) => {
    const message = await sendEmail({
        to,
        subject,
        html
    })

    return message
}


export const sendMailerWithAttachments = async (to, subject, html, attachments = []) => {
    const message = await sendEmail({
        to,
        subject,
        html,
        attachments
    })

    return message
}