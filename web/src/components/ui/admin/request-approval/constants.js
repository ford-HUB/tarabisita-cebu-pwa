export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
}

export const statusLabel = {
  [APPROVAL_STATUS.PENDING]: 'Pending',
  [APPROVAL_STATUS.VERIFIED]: 'Approved',
  [APPROVAL_STATUS.REJECTED]: 'Declined'
}

export const statusTone = {
  [APPROVAL_STATUS.PENDING]: 'bg-[#fff7ed] text-[#9b5a2c]',
  [APPROVAL_STATUS.VERIFIED]: 'bg-[#ecfdf3] text-[#117a45]',
  [APPROVAL_STATUS.REJECTED]: 'bg-[#fff1f2] text-[#b42318]'
}
