import { useMemo, useState } from 'react'
import {
  BUSINESS_LEGAL_REQUIREMENTS,
  createInitialProofFiles,
  createInitialProofForm,
  PROOF_FIELDS
} from '../constants/proof.constants'

const BusinessProofModal = ({ isOpen, isSubmittingProof, onClose, onSubmitProof }) => {
  const [proofStep, setProofStep] = useState(1)
  const [proofForm, setProofForm] = useState(createInitialProofForm)
  const [proofFiles, setProofFiles] = useState(createInitialProofFiles)

  const proofLinksCount = useMemo(
    () =>
      Object.entries(proofForm)
        .filter(([key, value]) => key !== 'notes' && String(value).trim())
        .length,
    [proofForm]
  )
  const proofFilesCount = useMemo(() => Object.values(proofFiles).filter(Boolean).length, [proofFiles])
  const canProceedFromStepTwo = proofLinksCount > 0 || proofFilesCount > 0

  const resetProofWizard = () => {
    setProofStep(1)
    setProofForm(createInitialProofForm())
    setProofFiles(createInitialProofFiles())
  }

  const handleClose = () => {
    resetProofWizard()
    onClose()
  }

  const handleProofFieldChange = (key, value) => {
    setProofForm((current) => ({ ...current, [key]: value }))
  }

  const handleProofFileChange = (key, file) => {
    setProofFiles((current) => ({ ...current, [key]: file || null }))
  }

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Unable to read selected image'))
      reader.readAsDataURL(file)
    })

  const handleSubmitProof = async () => {
    const proofs = PROOF_FIELDS.map((field) => proofForm[field.key])
      .map((item) => item.trim())
      .filter(Boolean)

    const proofDocuments = (
      await Promise.all(
        Object.values(proofFiles)
          .filter(Boolean)
          .map((file) => fileToDataUrl(file))
      )
    ).map((item) => String(item))

    const isSuccess = await onSubmitProof({
      proofs,
      proofDocuments,
      notes: proofForm.notes.trim()
    })

    if (isSuccess) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <h4 className="text-lg font-semibold text-[#1f1f1f]">Submit Business Proof</h4>
        <p className="mt-2 text-sm text-[#5b5b5b]">
          Step-by-step verification submission to keep your process clear and easy.
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs font-medium">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 ${
                proofStep === step ? 'bg-[#ff7a1a] text-white' : 'bg-[#f5eee4] text-[#7d7164]'
              }`}
            >
              Step {step}
            </span>
          ))}
        </div>

        {proofStep === 1 && (
          <div className="mt-4 rounded-xl border border-[#efe6dc] bg-[#fffdf9] p-4">
            <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Legal Requirements</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#4f4f4f]">
              {BUSINESS_LEGAL_REQUIREMENTS.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[#7d7164]">
              Prepare clear photos or links for these documents before continuing.
            </p>
          </div>
        )}

        {proofStep === 2 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {PROOF_FIELDS.map((field) => (
              <label key={field.key} className={`space-y-1 ${field.key === 'ownerValidId' ? 'md:col-span-2' : ''}`}>
                <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">{field.label} Link</span>
                <input
                  value={proofForm[field.key]}
                  onChange={(event) => handleProofFieldChange(field.key, event.target.value)}
                  placeholder="Paste cloud drive / hosted file link"
                  className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleProofFileChange(field.key, event.target.files?.[0])}
                  className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-xs text-[#4f4f4f]"
                />
              </label>
            ))}
          </div>
        )}

        {proofStep === 3 && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#efe6dc] bg-[#fffdf9] p-4 text-sm text-[#4f4f4f]">
              <p>
                <span className="font-semibold text-[#1f1f1f]">{proofLinksCount}</span> document link(s) added
              </p>
              <p className="mt-1">
                <span className="font-semibold text-[#1f1f1f]">{proofFilesCount}</span> document image(s) selected
              </p>
            </div>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-[#9b5a2c]">Notes (Optional)</span>
              <textarea
                value={proofForm.notes}
                onChange={(event) => handleProofFieldChange('notes', event.target.value)}
                rows={3}
                placeholder="Add notes for your submitted legal documents."
                className="w-full rounded-lg border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none transition focus:border-[#ff7a1a]"
              />
            </label>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
          >
            Cancel
          </button>
          {proofStep > 1 && (
            <button
              type="button"
              onClick={() => setProofStep((current) => current - 1)}
              className="rounded-full border border-[#e7dfd5] px-4 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f5eee4]"
            >
              Back
            </button>
          )}
          {proofStep < 3 ? (
            <button
              type="button"
              onClick={() => setProofStep((current) => current + 1)}
              disabled={proofStep === 2 && !canProceedFromStepTwo}
              className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitProof}
              disabled={isSubmittingProof || !canProceedFromStepTwo}
              className="rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#eb6c12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingProof ? 'Submitting...' : 'Submit Proof'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BusinessProofModal
