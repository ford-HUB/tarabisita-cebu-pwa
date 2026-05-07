import 'dotenv/config'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export const sendBrevoTransactionalEmail = async (payload) => {
    const apiKey = String(process.env.BREVO_APIKEY || '').trim()

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is required to send emails.')
    }

    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    const responseBody = await response.json().catch(() => ({}))

    if (!response.ok) {
        const message = responseBody?.message || response.statusText || 'Brevo API request failed.'
        throw new Error(`Brevo email API error: ${message}`)
    }

    return responseBody
}