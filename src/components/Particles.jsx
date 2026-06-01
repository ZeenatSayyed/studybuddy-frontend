import { useEffect, useRef } from 'react'

export default function Particles() {
  const ref = useRef(null)
  useEffect(() => {
    const container = ref.current
    if (!container) return
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div')
      p.className = 'particle'
      p.style.left = Math.random() * 100 + 'vw'
      p.style.animationDuration = (12 + Math.random() * 20) + 's'
      p.style.animationDelay = (Math.random() * 15) + 's'
      const size = (Math.random() * 3 + 1) + 'px'
      p.style.width = size; p.style.height = size
      container.appendChild(p)
    }
  }, [])
  return <div ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}
