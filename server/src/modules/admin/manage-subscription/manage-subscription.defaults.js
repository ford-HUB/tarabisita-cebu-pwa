/**
 * Default catalog (keep in sync with `web/src/components/business/billing/constants/billing.constants.js`).
 * Used when no DB document exists and as PayMongo checkout fallback amounts/titles.
 */
export const defaultManageSubscriptionCatalog = {
    pricing: [
        {
            id: '3-months',
            months: 3,
            title: 'Starter 3 Months',
            description: 'Best for newly listed businesses that want to get visible fast.',
            monthlyRate: 'PHP 799',
            billedAs: 'Billed every 3 months',
            total: 'PHP 2,397 / cycle',
            totalAmount: 2397
        },
        {
            id: '6-months',
            months: 6,
            title: 'Growth 6 Months',
            description: 'Balanced option with better savings and longer campaign exposure.',
            monthlyRate: 'PHP 999',
            billedAs: 'Billed every 6 months',
            total: 'PHP 5,994 / cycle',
            totalAmount: 5994,
            highlighted: true
        },
        {
            id: '12-months',
            months: 12,
            title: 'Pro 12 Months',
            description: 'Maximum savings for businesses ready for year-round visibility.',
            monthlyRate: 'PHP 1,199',
            billedAs: 'Billed every 12 months',
            total: 'PHP 14,388 / cycle',
            totalAmount: 14388
        }
    ],
    benefits: [
        { label: 'Plan-based monthly order capacity', included: true },
        { label: 'Unlimited partner listings', included: true },
        { label: 'Priority discovery placement', included: true },
        { label: 'Cloud storage access', included: true },
        { label: 'AI analytics', included: true }
    ],
    columns: [
        { key: 'starter', title: 'Starter', subtitle: '3-month billing' },
        { key: 'growth', title: 'Growth', subtitle: '6-month billing', highlighted: true },
        { key: 'pro', title: 'Pro', subtitle: '12-month billing' }
    ],
    rows: [
        {
            label: 'Published on the tourist map & search',
            values: { starter: 'yes', growth: 'yes', pro: 'yes' }
        },
        {
            label: 'Monthly order capacity (platform cap)',
            values: { starter: '10,000', growth: '25,000', pro: 'Unlimited' }
        },
        {
            label: 'Partner / cross-listings',
            values: { starter: 'yes', growth: 'yes', pro: 'yes' }
        },
        {
            label: 'Priority placement in discovery',
            values: { starter: 'yes', growth: 'yes', pro: 'yes' }
        },
        {
            label: 'Cloud storage for menus, photos & proofs',
            values: { starter: 'yes', growth: 'yes', pro: 'yes' }
        },
        {
            label: 'Checkout & renewals via Xendit',
            values: { starter: 'yes', growth: 'yes', pro: 'yes' }
        },
        {
            label: 'AI analytics',
            values: { starter: 'yes', growth: 'yes', pro: 'yes' }
        },
        {
            label: 'Billing cycle length',
            values: { starter: '3 months', growth: '6 months', pro: '12 months' }
        },
        {
            label: 'Total per cycle (before taxes)',
            values: { starter: 'PHP 2,397', growth: 'PHP 5,994', pro: 'PHP 14,388' }
        },
        {
            label: 'Effective from (shown as monthly)',
            values: { starter: 'PHP 799 / mo', growth: 'PHP 999 / mo', pro: 'PHP 1,199 / mo' }
        }
    ],
    freeTier: [
        ['Orders/month', 'Limited'],
        ['Business exposure', 'Basic listing'],
        ['Priority support', 'Unavailable']
    ]
}

/** Stable PayMongo / ledger plan ids (do not change without a migration). */
export const legacyPlanIdByMonths = {
    3: 'starter-3-months',
    6: 'growth-6-months',
    12: 'pro-12-months'
}

export const fallbackBillingPlanByMonths = {
    3: { id: 'starter-3-months', title: 'Starter 3 Months', amount: 2397 },
    6: { id: 'growth-6-months', title: 'Growth 6 Months', amount: 5994 },
    12: { id: 'pro-12-months', title: 'Pro 12 Months', amount: 14388 }
}
