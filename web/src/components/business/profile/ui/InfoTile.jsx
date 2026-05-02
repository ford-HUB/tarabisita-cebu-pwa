import { useMemo, useState } from 'react'
import { isTextTruncated, truncateText } from '../../../../shared/utils/text.utils'

const InfoTile = ({
  label,
  value,
  tone = 'soft',
  expandable = false,
  maxLength = 80,
  oneLineCollapsed = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const baseClass =
    tone === 'soft'
      ? 'rounded-xl bg-[#f8f5f0] p-3'
      : 'rounded-xl border border-[#efe6dc] bg-[#fffdf9] p-4'
  const canExpand = expandable && isTextTruncated(value, maxLength)
  const isCollapsed = canExpand && !isExpanded
  const displayValue = useMemo(() => {
    if (!canExpand || isExpanded) return value
    return truncateText(value, maxLength)
  }, [canExpand, isExpanded, maxLength, value])

  return (
    <div className={baseClass}>
      <p className="text-xs uppercase tracking-wide text-[#9b5a2c]">{label}</p>
      <p
        className={`mt-2 text-sm font-medium text-[#1f1f1f] ${
          oneLineCollapsed && isCollapsed ? 'block w-full truncate whitespace-nowrap' : 'wrap-break-word'
        }`}
      >
        {displayValue}
      </p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="mt-2 text-xs font-medium text-[#9b5a2c] transition hover:text-[#7a461f]"
        >
          {isExpanded ? 'View less' : 'View more'}
        </button>
      )}
    </div>
  )
}

export default InfoTile
