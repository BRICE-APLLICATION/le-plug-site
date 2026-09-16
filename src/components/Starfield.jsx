import { useEffect, useMemo, useState } from 'react'

const STAR_COUNT = 140

function randomStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    minOpacity: Math.random() * 0.3,
    maxOpacity: Math.random() * 0.5 + 0.5,
  }))
}

export default function Starfield() {
  const stars = useMemo(randomStars, [])
  const [shootingStars, setShootingStars] = useState([])

  useEffect(() => {
    let cancelled = false

    function scheduleNext() {
      const delay = 10000 + Math.random() * 10000
      const timeout = setTimeout(() => {
        if (cancelled) return
        const id = Date.now()
        setShootingStars((prev) => [...prev, { id, top: Math.random() * 40 }])
        setTimeout(() => {
          setShootingStars((prev) => prev.filter((s) => s.id !== id))
        }, 1700)
        scheduleNext()
      }, delay)
      return timeout
    }

    const timeout = scheduleNext()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="star"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            '--min-o': star.minOpacity,
            '--max-o': star.maxOpacity,
          }}
        />
      ))}
      {shootingStars.map((s) => (
        <span
          key={s.id}
          className="shooting-star"
          style={{ '--start-top': `${s.top}%` }}
        />
      ))}
    </div>
  )
}
