import { isImageLink } from './utils'

const ReviewDocumentsPanel = ({ verificationProofs }) => (
  <article className="space-y-4 rounded-2xl border border-[#ece3d9] bg-white p-4">
    <div>
      <h3 className="text-base font-semibold text-[#1f1f1f]">Submitted Documents</h3>
      <p className="mt-1 text-sm text-[#5d554e]">
        Check each proof image/link clearly before deciding the business verification action.
      </p>
    </div>

    <div className="space-y-3">
      {verificationProofs.length ? (
        verificationProofs.map((proofUrl, index) => (
          <div
            key={`${proofUrl}-${index}`}
            className="grid gap-3 rounded-xl border border-[#eee5dc] bg-[#fffdfa] p-3 md:grid-cols-[1fr_1.5fr]"
          >
            {isImageLink(proofUrl) ? (
              <img
                src={proofUrl}
                alt={`Submitted proof ${index + 1}`}
                className="h-28 w-full rounded-lg border border-[#ece3d9] object-cover"
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-[#e2d5c8] bg-white text-sm text-[#7a6e61]">
                Document Link
              </div>
            )}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1f1f1f]">Document {index + 1}</p>
                <p className="mt-1 break-all text-xs text-[#5d554e]">{proofUrl}</p>
              </div>
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-fit items-center rounded-full border border-[#e7dfd5] px-3 py-1 text-xs font-medium text-[#3f3a35] transition hover:bg-[#f5eee4]"
              >
                View Clearly
              </a>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-[#e7dfd5] bg-[#fffdfa] p-4 text-sm text-[#6f655b]">
          No verification documents submitted yet.
        </div>
      )}
    </div>

    <div className="rounded-xl border border-[#f4dcbf] bg-[#fff7ed] p-3">
      <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">Next Action</p>
      <p className="mt-1 text-sm text-[#5d554e]">
        If details are valid, approve. If invalid or incomplete, decline and add notes.
      </p>
    </div>
  </article>
)

export default ReviewDocumentsPanel
