export const BUSINESS_LEGAL_REQUIREMENTS = [
  'DTI/SEC/CDA Business Registration Certificate',
  'Barangay Business Clearance',
  "Mayor's / Business Permit",
  'BIR Certificate of Registration (Form 2303)',
  'Valid government-issued ID of business owner'
]

export const PROOF_FIELDS = [
  { key: 'registrationCertificate', label: 'DTI/SEC/CDA Certificate' },
  { key: 'barangayClearance', label: 'Barangay Clearance' },
  { key: 'businessPermit', label: 'Business Permit' },
  { key: 'birCertificate', label: 'BIR Form 2303' },
  { key: 'ownerValidId', label: 'Owner Valid ID' }
]

export const createInitialProofForm = () => ({
  registrationCertificate: '',
  barangayClearance: '',
  businessPermit: '',
  birCertificate: '',
  ownerValidId: '',
  notes: ''
})

export const createInitialProofFiles = () => ({
  registrationCertificate: null,
  barangayClearance: null,
  businessPermit: null,
  birCertificate: null,
  ownerValidId: null
})
