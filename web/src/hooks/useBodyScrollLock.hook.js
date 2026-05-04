import { useEffect } from 'react'

let lockCount = 0
let savedHtmlOverflow = ''
let savedBodyOverflow = ''

export const useBodyScrollLock = (locked = true) => {
  useEffect(() => {
    if (!locked) return undefined
    const html = document.documentElement
    const body = document.body
    if (lockCount === 0) {
      savedHtmlOverflow = html.style.overflow
      savedBodyOverflow = body.style.overflow
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
    }
    lockCount += 1
    return () => {
      lockCount -= 1
      if (lockCount <= 0) {
        lockCount = 0
        html.style.overflow = savedHtmlOverflow
        body.style.overflow = savedBodyOverflow
      }
    }
  }, [locked])
}
