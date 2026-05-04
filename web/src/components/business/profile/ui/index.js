import gcashLogo from '../../../../assets/payment-method-logo/gcash.jpeg'
import mayaLogo from '../../../../assets/payment-method-logo/maya.jpeg'

export { default as CoordinateInput } from './CoordinateInput'
export { default as InfoTile } from './InfoTile'
export { default as StatCard } from './StatCard'

/** Central map of static media used across the app (Vite-resolved URLs). */
export const appMediaAssets = {
  checkoutPaymentLogos: {
    GCASH: gcashLogo,
    MAYA: mayaLogo
  }
}

export const checkoutPaymentLogos = appMediaAssets.checkoutPaymentLogos
