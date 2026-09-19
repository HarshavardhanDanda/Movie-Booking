let checkoutScript

export function loadRazorpay() {
	if (window.Razorpay) return Promise.resolve()
	if (checkoutScript) return checkoutScript
	checkoutScript = new Promise((resolve, reject) => {
		const script = document.createElement('script')
		const fail = () => {
			clearTimeout(timer)
			script.remove()
			checkoutScript = null
			reject(new Error('Unable to load payment checkout. Please check your connection and retry.'))
		}
		const timer = setTimeout(fail, 20000)
		script.src = 'https://checkout.razorpay.com/v1/checkout.js'
		script.onload = () => {
			clearTimeout(timer)
			window.Razorpay ? resolve() : fail()
		}
		script.onerror = fail
		document.body.appendChild(script)
	})
	return checkoutScript
}

export const money = (paise) =>
	new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100)
