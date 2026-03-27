import { useEffect, useRef } from 'react'

export function useAutoRefresh(callback: () => void, intervalMs = 15000) {
  const saved = useRef(callback)
  useEffect(() => { saved.current = callback })
  useEffect(() => {
    const id = setInterval(() => saved.current(), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
