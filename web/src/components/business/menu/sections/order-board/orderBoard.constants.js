import { FiCheckCircle, FiClock, FiPackage } from 'react-icons/fi'

/** Kanban columns for customer order board. Each column key matches its API `status`; canceled orders
 * are intentionally excluded from the board and remain visible only in Today's Record and history. */
export const ORDER_BOARD_COLUMNS = [
  { key: 'PLACED', title: 'New Order', icon: FiPackage, countClassName: 'bg-[#fff0e3] text-[#9b5a2c]' },
  { key: 'PROCESSING', title: 'Being Processed', icon: FiClock, countClassName: 'bg-[#fff8dd] text-[#9c6a12]' },
  { key: 'FINISHED', title: 'Finished', icon: FiCheckCircle, countClassName: 'bg-[#e8f8ec] text-[#2a7b45]' }
]

export const sampleOrders = [
  {
    id: 'ORD-12041',
    customer: 'Maria Santos',
    productName: 'Spicy Chicken Inasal',
    productImage: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Grilled chicken inasal served with java rice and spicy atchara.',
    items: 3,
    total: 'PHP 835.00',
    time: '5 mins ago',
    status: 'PLACED'
  },
  {
    id: 'ORD-12042',
    customer: 'John Dela Cruz',
    productName: 'Sizzling Sisig',
    productImage: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Crispy pork sisig with calamansi and chili flakes.',
    items: 2,
    total: 'PHP 540.00',
    time: '8 mins ago',
    status: 'PLACED'
  },
  {
    id: 'ORD-12043',
    customer: 'Lea Fernandez',
    productName: 'Halo-Halo Supreme',
    productImage: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Layered shaved ice dessert with leche flan and ube ice cream.',
    items: 1,
    total: 'PHP 210.00',
    time: '11 mins ago',
    status: 'PLACED'
  },
  {
    id: 'ORD-12035',
    customer: 'Anne Villanueva',
    productName: 'Beef Kare-Kare',
    productImage: 'https://images.unsplash.com/photo-1633427230124-87199d1827b2?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Peanut stew with tender beef and vegetables, served with bagoong.',
    items: 4,
    total: 'PHP 1,120.00',
    time: '14 mins ago',
    status: 'PROCESSING'
  },
  {
    id: 'ORD-12031',
    customer: 'Carlo Reyes',
    productName: 'Pork Adobo Meal',
    productImage: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Classic pork adobo with garlic fried rice and egg.',
    items: 1,
    total: 'PHP 265.00',
    time: '20 mins ago',
    status: 'PROCESSING'
  },
  {
    id: 'ORD-12028',
    customer: 'Bryan Lim',
    productName: 'Seafood Palabok',
    productImage: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Rice noodles with shrimp sauce, squid rings, and chicharon.',
    items: 3,
    total: 'PHP 960.00',
    time: '26 mins ago',
    status: 'PROCESSING'
  },
  {
    id: 'ORD-12020',
    customer: 'Sofia Lopez',
    productName: 'Lechon Kawali Platter',
    productImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Crispy lechon kawali platter with liver sauce and pickled papaya.',
    items: 5,
    total: 'PHP 1,780.00',
    time: '34 mins ago',
    status: 'FINISHED'
  },
  {
    id: 'ORD-12018',
    customer: 'Miguel Ramos',
    productName: 'Chicken BBQ Skewers',
    productImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Charcoal grilled chicken skewers glazed with sweet soy sauce.',
    items: 2,
    total: 'PHP 620.00',
    time: '48 mins ago',
    status: 'FINISHED'
  },
  {
    id: 'ORD-12016',
    customer: 'Janice Cruz',
    productName: 'Pancit Canton',
    productImage: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=300&q=80',
    productDetails: 'Stir-fried egg noodles with mixed vegetables and chicken.',
    items: 2,
    total: 'PHP 480.00',
    time: '55 mins ago',
    status: 'FINISHED'
  }
]

export const defaultCancelReasons = [
  'Customer requested cancellation',
  'Item is out of stock',
  'Kitchen overload / delayed preparation',
  'Duplicate order detected'
]

export const ACTION_MENU_WIDTH = 176
export const ACTION_MENU_HEIGHT = 128
export const ACTION_MENU_GAP = 8
export const VIEWPORT_PADDING = 8
