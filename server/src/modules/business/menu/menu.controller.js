import {
    createBusinessMenuItemByUserId,
    deleteBusinessMenuItemByUserId,
    getBusinessMenuItemsByUserId,
    restoreBusinessMenuItemByUserId,
    updateBusinessMenuItemByUserId,
    updateBusinessMenuItemStockByUserId
} from './menu.service.js'
import { appendActivityLog } from '../../../shared/utils/business-controller.helpers.js'

export const getMyBusinessMenuItems = async (req, res) => {
    try {
        const includeDeleted = String(req.query.includeDeleted || '').toLowerCase() === 'true'
        const menuItems = await getBusinessMenuItemsByUserId(req.user._id, { includeDeleted })
        await appendActivityLog(req, {
            action: 'MENU_ITEMS_VIEWED',
            category: 'MENU_MANAGEMENT',
            severity: 'INFO',
            description: 'Business menu items were viewed.',
            details: {
                includeDeleted
            }
        })
        return res.status(200).json({ data: menuItems })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const createMyBusinessMenuItem = async (req, res) => {
    try {
        const createdItem = await createBusinessMenuItemByUserId(req.user._id, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'MENU_ITEM_CREATED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'A menu item was created.',
            details: {
                menuItemId: createdItem.id,
                menuItemName: createdItem.name
            }
        })
        return res.status(201).json({
            message: 'Menu item created successfully',
            data: createdItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const deleteMyBusinessMenuItem = async (req, res) => {
    try {
        await deleteBusinessMenuItemByUserId(req.user._id, req.validatedData.params.menuItemId)
        await appendActivityLog(req, {
            action: 'MENU_ITEM_DELETED',
            category: 'MENU_MANAGEMENT',
            severity: 'MEDIUM',
            description: 'A menu item was moved to deleted list.',
            details: {
                menuItemId: req.validatedData.params.menuItemId
            }
        })
        return res.status(200).json({ message: 'Menu item moved to deleted list successfully' })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        if (error.message === 'MENU_ITEM_ALREADY_DELETED') {
            return res.status(400).json({ message: 'Menu item is already deleted' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const updateMyBusinessMenuItemStock = async (req, res) => {
    try {
        const { menuItemId } = req.validatedData.params
        const { stockStatus } = req.validatedData.body
        const updatedItem = await updateBusinessMenuItemStockByUserId(req.user._id, menuItemId, stockStatus)
        await appendActivityLog(req, {
            action: 'MENU_STOCK_STATUS_UPDATED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'Menu item stock status was updated.',
            details: {
                menuItemId,
                stockStatus
            }
        })
        return res.status(200).json({
            message: 'Menu availability updated successfully',
            data: updatedItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const restoreMyBusinessMenuItem = async (req, res) => {
    try {
        const restoredItem = await restoreBusinessMenuItemByUserId(req.user._id, req.validatedData.params.menuItemId)
        await appendActivityLog(req, {
            action: 'MENU_ITEM_RESTORED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'A deleted menu item was restored.',
            details: {
                menuItemId: restoredItem.id,
                menuItemName: restoredItem.name
            }
        })
        return res.status(200).json({
            message: 'Menu item restored successfully',
            data: restoredItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_DELETED') {
            return res.status(400).json({ message: 'Menu item is not deleted' })
        }
        return res.status(500).json({ message: error.message })
    }
}

export const updateMyBusinessMenuItem = async (req, res) => {
    try {
        const { menuItemId } = req.validatedData.params
        const updatedItem = await updateBusinessMenuItemByUserId(req.user._id, menuItemId, req.validatedData.body)
        await appendActivityLog(req, {
            action: 'MENU_ITEM_UPDATED',
            category: 'MENU_MANAGEMENT',
            severity: 'LOW',
            description: 'A menu item was updated.',
            details: {
                menuItemId: updatedItem.id,
                menuItemName: updatedItem.name
            }
        })
        return res.status(200).json({
            message: 'Menu item updated successfully',
            data: updatedItem
        })
    } catch (error) {
        if (error.message === 'BUSINESS_NOT_FOUND') {
            return res.status(404).json({ message: 'Business profile not found' })
        }
        if (error.message === 'MENU_ITEM_NOT_FOUND') {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        return res.status(500).json({ message: error.message })
    }
}
