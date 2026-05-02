const ReviewModalStepNav = ({ activeStep, onSelectStep }) => (
  <div className="flex items-center justify-between border-b border-[#f0e7dd] px-5 py-3">
    <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">
      Step {activeStep + 1} of 2 - {activeStep === 0 ? 'Account Information' : 'Submitted Documents'}
    </p>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onSelectStep(0)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          activeStep === 0 ? 'bg-[#f2e8da] text-[#9b5a2c]' : 'border border-[#e7dfd5] text-[#6f655b]'
        }`}
      >
        Info
      </button>
      <button
        type="button"
        onClick={() => onSelectStep(1)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
          activeStep === 1 ? 'bg-[#f2e8da] text-[#9b5a2c]' : 'border border-[#e7dfd5] text-[#6f655b]'
        }`}
      >
        Documents
      </button>
    </div>
  </div>
)

export default ReviewModalStepNav
