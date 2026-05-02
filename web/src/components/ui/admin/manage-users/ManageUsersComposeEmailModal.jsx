import { useEffect, useId, useState } from 'react'
import { FiPaperclip, FiSend, FiX } from 'react-icons/fi'
import { toast } from 'sonner'
import { sendAdminUserWarningEmail } from '../../../../services/auth/auth.service'
import ManageUsersAvatar from './ManageUsersAvatar'

const defaultSubject = 'Regarding your TaraBisita account'

const ManageUsersComposeEmailModal = ({ user, onClose }) => {
  const formId = useId()
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState([])
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    setSubject(defaultSubject)
    setMessage('')
    setFiles([])
  }, [user?.id])

  const onPickFiles = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    setFiles((prev) => [...prev, ...list].slice(0, 10))
    e.target.value = ''
  }

  const removeFileAt = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!user?.email) {
      toast.error('This user has no email.')
      return
    }
    const trimmed = message.trim()
    if (!trimmed) {
      toast.error('Please enter a message.')
      return
    }
    try {
      setIsSending(true)
      const fd = new FormData()
      fd.append('subject', subject.trim() || defaultSubject)
      fd.append('message', trimmed)
      files.forEach((f) => fd.append('files', f))
      await sendAdminUserWarningEmail(user.id, fd)
      toast.success('Email sent.')
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send email.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-compose-title`}
      className="flex w-full max-w-lg shrink-0 flex-col rounded-2xl border border-[#ece3d9] bg-white shadow-xl"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#f0e7dd] px-5 py-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ManageUsersAvatar name={user?.name} avatar={user?.avatar} sizeClass="h-10 w-10" />
          <div className="min-w-0">
            <h2 id={`${formId}-compose-title`} className="text-base font-semibold text-[#1f1f1f]">
              Compose email
            </h2>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#9b5a2c]">To</p>
            <p className="truncate text-sm font-medium text-[#2f2f2f]">{user?.email || '—'}</p>
            {user?.name ? <p className="truncate text-xs text-[#6d645d]">{user.name}</p> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg border border-[#ece3d9] p-2 text-[#6d645d] transition hover:bg-[#f7f3ed]"
          aria-label="Close compose"
        >
          <FiX size={18} />
        </button>
      </div>

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <label className="block text-xs font-medium text-[#6d645d]" htmlFor={`${formId}-subject`}>
            Subject
            <input
              id={`${formId}-subject`}
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#ff7a1a]"
            />
          </label>

          <label className="block text-xs font-medium text-[#6d645d]" htmlFor={`${formId}-message`}>
            Message
            <textarea
              id={`${formId}-message`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              placeholder="Write your notice or warning here…"
              className="mt-1 w-full resize-y rounded-xl border border-[#e7dfd5] bg-white px-3 py-2 text-sm text-[#1f1f1f] outline-none focus:border-[#ff7a1a]"
            />
          </label>

          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#e1d4c5] bg-[#fcfaf7] px-4 py-3 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f5eee4]">
              <FiPaperclip size={16} aria-hidden />
              <span>Add attachments</span>
              <input type="file" multiple className="sr-only" onChange={onPickFiles} accept="*/*" />
            </label>
            {files.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-[#5f5f5f]">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7f3ed] px-2 py-1">
                    <span className="min-w-0 truncate" title={f.name}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFileAt(i)}
                      className="shrink-0 text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-[#9d8f80]">Up to 10 files, 12 MB each.</p>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-[#f0e7dd] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e1d4c5] px-4 py-2.5 text-sm font-medium text-[#5f5f5f] transition hover:bg-[#f7f3ed]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSending}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#9b5a2c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#824b24] disabled:cursor-not-allowed disabled:opacity-70 min-[400px]:flex-none"
          >
            <FiSend size={16} aria-hidden />
            {isSending ? 'Sending…' : 'Send email'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ManageUsersComposeEmailModal
