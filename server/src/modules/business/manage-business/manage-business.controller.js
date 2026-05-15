import {
    getBusinessApprovalRequests,
    getBusinessPartnersForAdmin,
    updateBusinessVerificationStatusById
} from './manage-business.service.js'

export const getBusinessApprovalQueue = async (req, res) => {
    try {
        const status = req.query.status
        const requests = await getBusinessApprovalRequests({ status })

        return res.status(200).json({ data: requests })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const getBusinessPartners = async (_req, res) => {
    try {
        const partners = await getBusinessPartnersForAdmin()
        return res.status(200).json({ data: partners })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const updateBusinessApprovalStatus = async (req, res) => {
    try {
        const { businessId } = req.params
        const { status, notes, revoke } = req.body

        const updated = await updateBusinessVerificationStatusById({ businessId, status, notes, revoke: Boolean(revoke) })

        return res.status(200).json({
            message: 'Business verification status updated successfully',
            data: updated
        })
    } catch (error) {
        if (error.message === 'INVALID_STATUS') {
            return res.status(400).json({ message: 'Invalid verification status' })
        }
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business not found' })
        }
        if (error.message === 'REVOKE_NOT_VERIFIED') {
            return res.status(400).json({ message: 'Only approved businesses can have their approval revoked.' })
        }
        if (error.message === 'INVALID_REVOKE_STATUS') {
            return res.status(400).json({ message: 'Revoke must set status to pending.' })
        }
        return res.status(500).json({ message: error.message })
    }
}
