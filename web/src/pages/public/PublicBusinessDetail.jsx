import BusinessDetail from '../dashboard/tourist/BusinessDetail.jsx'

/** Public (pre-login) partner menu page — uses guest cart and redirects to sign-in at checkout. */
const PublicBusinessDetail = () => <BusinessDetail guestBrowse />

export default PublicBusinessDetail
