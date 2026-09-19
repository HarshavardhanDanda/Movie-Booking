let scriptPromise
export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      const timer = setTimeout(() => failed(), 15000)
      function failed() {
        clearTimeout(timer)
        script.remove()
        scriptPromise = null
        reject(new Error('Google sign-in could not load. Please refresh to try again.'))
      }
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => {
        clearTimeout(timer)
        if (window.google?.accounts?.id) resolve(window.google.accounts.id)
        else failed()
      }
      script.onerror = failed
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}
