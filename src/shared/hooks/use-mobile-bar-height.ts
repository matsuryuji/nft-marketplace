import { useEffect, useRef } from 'react'

const CSS_VARIABLE = '--mobile-bar-height'

export function useMobileBarHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const root = document.documentElement
    const update = () => root.style.setProperty(CSS_VARIABLE, `${element.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      observer.disconnect()
      root.style.removeProperty(CSS_VARIABLE)
    }
  }, [])

  return ref
}
