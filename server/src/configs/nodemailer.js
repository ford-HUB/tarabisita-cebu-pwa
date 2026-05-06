import 'dotenv/config'

const BREVO_SEND_EMAIL_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

const buildRecipients = (to) => {
    if (Array.isArray(to)) {
        return to
            .map((email) => String(email || '').trim())
            .filter(Boolean)
            .map((email) => ({ email }))
    }

    return String(to || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)
        .map((email) => ({ email }))
}

const buildAttachments = (attachments = []) => {
    return (attachments || [])
        .filter((attachment) => attachment?.filename && attachment?.content)
        .map((attachment) => {
            const base64Content = Buffer.isBuffer(attachment.content)
                ? attachment.content.toString('base64')
                : String(attachment.content)

            return {
                name: attachment.filename,
                content: base64Content
            }
        })
}

export const sendBrevoEmail = async ({ to, subject, html, attachments = [] }) => {
    const recipients = buildRecipients(to)
    if (!recipients.length) {
        throw new Error('No recipient email was provided')
    }

    const fromEmail = process.env.BREVO_LOGIN
    if (!fromEmail) {
        throw new Error('Email sender is not configured. Set EMAIL_USER or BREVO_LOGIN.')
    }

    const apiKey = process.env.BREVO_APIKEY
    if (!apiKey) {
        throw new Error('BREVO_APIKEY is missing')
    }

    const payload = {
        sender: {
            email: fromEmail,
            name: 'tarabisita-noreply@gmail.com'
        },
        to: recipients,
        subject,
        htmlContent: html
    }

    const normalizedAttachments = buildAttachments(attachments)
    if (normalizedAttachments.length) {
        payload.attachment = normalizedAttachments
    }

    const response = await fetch(BREVO_SEND_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const details = await response.text()
        throw new Error(`Brevo API request failed (${response.status}): ${details}`)
    }

    return response.json()
}