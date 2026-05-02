import { z } from 'zod'

const billingAddressFields = z.object({
  name: z.string(),
  street: z.string(),
  cityState: z.string(),
  country: z.string(),
  zipPostal: z.string(),
  townCity: z.string()
})

export const billingAddressFormSchema = billingAddressFields.refine(
  (data) =>
    [data.name, data.street, data.cityState, data.country, data.zipPostal, data.townCity].some(
      (value) => String(value ?? '').trim().length > 0
    ),
  { message: 'Please enter your billing address.', path: ['name'] }
)
