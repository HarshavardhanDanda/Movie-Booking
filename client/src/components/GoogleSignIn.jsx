import axios from 'axios'
import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { loadGoogleIdentity } from '../utils/google'

export default function GoogleSignIn() {
  const container = useRef(null)
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return
    let active = true
    let observer
    loadGoogleIdentity().then((google) => {
      if (!active || !container.current) return
      google.initialize({
        client_id: clientId,
        auto_select: false,
        callback: async ({ credential }) => {
          if (!active || pending.current) return
          pending.current = true
          setBusy(true)
          setError('')
          try {
            const { data } = await axios.post('/auth/google', { credential })
            if (!active) return
            setAuth({ token: data.token, ...data.user })
            const from = location.state?.from
            navigate(typeof from === 'string' && /^\/(checkout|showtime)\/[a-f\d]{24}$/i.test(from) ? from : '/', { replace: true })
          } catch (err) {
            if (active) setError(err.response?.data?.message || 'Google sign-in failed. Please try again.')
          } finally {
            pending.current = false
            if (active) setBusy(false)
          }
        }
      })
      let lastWidth = 0
      const render = () => {
        if (!active || !container.current) return
        const width = Math.min(400, Math.floor(container.current.clientWidth))
        if (!width || width === lastWidth) return
        lastWidth = width
        container.current.replaceChildren()
        google.renderButton(container.current, { theme: 'outline', size: 'large', text: 'continue_with', width })
      }
      render()
      observer = new ResizeObserver(render)
      observer.observe(container.current)
    }).catch((err) => { if (active) setError(err.message) })
    return () => { active = false; observer?.disconnect() }
  }, [clientId, navigate, setAuth, location.state?.from])

  if (!clientId) return null
  return <div className="space-y-3 border-t border-[#d7ddd5] pt-5">
    <div ref={container} className={`flex w-full justify-center ${busy ? 'pointer-events-none opacity-50' : ''}`} />
    {busy && <p role="status" className="text-center text-sm text-[#64736b]">Signing in...</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>
}
