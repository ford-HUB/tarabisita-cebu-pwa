const VerificationCodeInput = ({ value, onChange, length = 6, disabled = false }) => {
  const normalizedValue = value.slice(0, length)
  const codeChars = Array.from({ length }, (_, index) => normalizedValue[index] || '')

  const handleInputChange = (event, index) => {
    const nextChar = event.target.value.replace(/\D/g, '').slice(-1)
    const nextCode = normalizedValue.split('')
    nextCode[index] = nextChar

    const finalValue = nextCode.join('').slice(0, length)
    onChange(finalValue)

    if (nextChar && index < length - 1) {
      const nextInput = document.getElementById(`verification-code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !codeChars[index] && index > 0) {
      const previousInput = document.getElementById(`verification-code-${index - 1}`)
      previousInput?.focus()
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      {codeChars.map((digit, index) => (
        <input
          key={index}
          id={`verification-code-${index}`}
          className="h-12 w-12 rounded-lg border border-[#d7d2ca] bg-[#f5f3ef] text-center text-lg font-semibold text-[#2a2927] outline-none transition focus:border-[#c66b2b] disabled:cursor-not-allowed disabled:opacity-70"
          inputMode="numeric"
          maxLength={1}
          placeholder="0"
          type="text"
          value={digit}
          disabled={disabled}
          onChange={(event) => handleInputChange(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        />
      ))}
    </div>
  )
}

export default VerificationCodeInput
