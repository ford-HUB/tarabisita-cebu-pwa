import { APPROVAL_STATUS } from './constants'
import ReviewAccountInfoPanel from './ReviewAccountInfoPanel'
import ReviewDocumentsPanel from './ReviewDocumentsPanel'
import ReviewModalFooter from './ReviewModalFooter'
import ReviewModalHeader from './ReviewModalHeader'
import ReviewModalStepNav from './ReviewModalStepNav'
import { useReviewModal } from '../../../../hooks/useReviewModal.hook'

const ReviewModal = ({ request, onClose, onOpenApprove, onOpenDecline, onOpenRevoke }) => {
  const { activeStep, setActiveStep, goPrevious, goNext } = useReviewModal(request?.id)

  if (!request) return null

  const isApproved = request.status === APPROVAL_STATUS.VERIFIED

  return (
    <div className="fixed inset-0 z-50 bg-black/45 p-3 md:p-5">
      <div className="mx-auto flex h-[calc(100vh-24px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#ece3d9] bg-white shadow-xl md:h-[calc(100vh-40px)]">
        <ReviewModalHeader
          businessName={request.businessName}
          logo={request.logo}
          submittedAt={request.submittedAt}
          onClose={onClose}
        />

        <ReviewModalStepNav activeStep={activeStep} onSelectStep={setActiveStep} />

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {activeStep === 0 ? (
            <ReviewAccountInfoPanel request={request} />
          ) : (
            <ReviewDocumentsPanel verificationProofs={request.verificationProofs} />
          )}
        </div>

        <ReviewModalFooter
          activeStep={activeStep}
          isApproved={isApproved}
          onPrevious={goPrevious}
          onNext={goNext}
          onClose={onClose}
          onOpenDecline={onOpenDecline}
          onOpenApprove={onOpenApprove}
          onOpenRevoke={onOpenRevoke}
        />
      </div>
    </div>
  )
}

export default ReviewModal
