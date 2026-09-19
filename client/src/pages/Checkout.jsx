import axios from 'axios'
import { useContext, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { CheckCircleIcon, TicketIcon } from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import { AuthContext } from '../context/AuthContext'
import { loadRazorpay, money } from '../utils/razorpay'

const primary =
	'w-full rounded-lg bg-[#203f38] px-5 py-3 font-semibold text-white hover:bg-[#31594b] disabled:cursor-not-allowed disabled:opacity-50'

export default function Checkout() {
	const { id } = useParams()
	const { auth } = useContext(AuthContext)
	const location = useLocation()
	const [booking, setBooking] = useState(null)
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')
	const [busy, setBusy] = useState(false)
	const [loading, setLoading] = useState(true)
	const [now, setNow] = useState(Date.now())
	const [awaitingVerification, setAwaitingVerification] = useState(false)
	const checking = useRef(false)
	const checkout = useRef(null)
	const key = `payment-response:${id}`
	const config = { headers: { Authorization: `Bearer ${auth.token}` } }
	const message = (err) =>
		err.response?.data?.message || err.message || 'Something went wrong. Please try again.'

	async function refresh() {
		const response = await axios.get(`/bookings/${id}`, config)
		setBooking(response.data.data.booking)
		return response.data.data.booking
	}

	async function verify(payment) {
		checking.current = true
		setBusy(true)
		setError('')
		setAwaitingVerification(true)
		setNotice('Checking your payment. Please do not pay again.')
		try {
			const response = await axios.post('/payments/verify', { bookingId: id, ...payment }, config)
			const confirmed = response.data.data.booking
			setBooking(confirmed)
			if (confirmed.status === 'confirmed' || confirmed.status === 'cancelled') {
				sessionStorage.removeItem(key)
				setAwaitingVerification(false)
				setNotice(
					confirmed.status === 'cancelled'
						? 'Your booking could not be completed. If payment was collected, contact the theatre to check it and arrange a refund.'
						: ''
				)
			}
		} catch (err) {
			setError(message(err))
			setNotice(
				'Payment confirmation is still pending. Use Check payment status before trying another payment.'
			)
		} finally {
			checking.current = false
			setBusy(false)
		}
	}

	useEffect(() => {
		if (!auth.token) return
		let active = true
		setLoading(true)
		setBooking(null)
		axios
			.get(`/bookings/${id}`, { headers: { Authorization: `Bearer ${auth.token}` } })
			.then(({ data }) => {
				if (!active) return
				setBooking(data.data.booking)
				setAwaitingVerification(!!sessionStorage.getItem(key) && data.data.booking.status !== 'confirmed')
			})
			.catch((err) => {
				if (active) setError(message(err))
			})
			.finally(() => {
				if (active) setLoading(false)
			})
		const timer = setInterval(() => setNow(Date.now()), 1000)
		return () => {
			active = false
			clearInterval(timer)
			checkout.current?.close()
		}
	}, [id, auth.token])

	async function checkStatus() {
		if (busy) return
		setBusy(true)
		setError('')
		try {
			const current = await refresh()
			if (current.status === 'confirmed') {
				sessionStorage.removeItem(key)
				setAwaitingVerification(false)
				setNotice('')
			} else {
				const saved = sessionStorage.getItem(key)
				if (saved) await verify(JSON.parse(saved))
				else setNotice('Your booking has not been confirmed yet.')
			}
		} catch (err) {
			setError(message(err))
		} finally {
			setBusy(false)
		}
	}

	async function cancelBooking() {
		if (busy || awaitingVerification) return
		setBusy(true)
		setError('')
		try {
			const { data } = await axios.post(`/bookings/${id}/cancel`, {}, config)
			setBooking(data.data)
			setNotice('Booking cancelled. Your seats have been released.')
		} catch (err) {
			setError(message(err))
		} finally {
			setBusy(false)
		}
	}

	async function pay() {
		if (busy) return
		setBusy(true)
		setError('')
		setNotice('')
		try {
			await loadRazorpay()
			const { data } = await axios.post('/payments/order', { bookingId: id }, config)
			const order = data.data
			setBooking((current) => ({ ...current, razorpayOrderId: order.orderId }))
			let paymentReturned = false
			const popup = new window.Razorpay({
				key: order.keyId,
				order_id: order.orderId,
				amount: order.amount,
				currency: order.currency,
				name: 'Movie Booking',
				description: booking.snapshot.movieName,
				prefill: { name: auth.username || '', email: auth.email || '' },
				theme: { color: '#203f38' },
				handler: (payment) => {
					paymentReturned = true
					// Keep the response for a verification retry if the connection drops.
					try {
						sessionStorage.setItem(key, JSON.stringify(payment))
					} catch {
						/* Verification still works if browser storage is unavailable. */
					}
					verify(payment)
				},
				modal: {
					ondismiss: () => {
						if (!paymentReturned && !checking.current) {
							setBusy(false)
							setNotice('Checkout closed. You can retry while your seats are reserved.')
						}
					}
				}
			})
			popup.on('payment.failed', (response) =>
				setError(response.error?.description || 'Payment failed. Please try again.')
			)
			checkout.current = popup
			popup.open()
		} catch (err) {
			setError(message(err))
			setBusy(false)
		}
	}

	if (!auth.token) return <Navigate to="/login" replace state={{ from: location.pathname }} />
	const confirmed = booking?.status === 'confirmed'
	const remaining = booking ? Math.max(0, Math.ceil((new Date(booking.expiresAt).getTime() - now) / 1000)) : 0
	const expired = booking && (booking.status === 'expired' || (!remaining && booking.status === 'pending'))
	const canPay = booking?.status === 'pending' && !expired && !awaitingVerification

	return (
		<div className="min-h-screen bg-[#f4f3ee] pb-12">
			<Navbar />
			<main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
				<h1 className="mb-6 text-3xl font-bold text-[#203b38]">{confirmed ? 'Booking confirmed' : 'Checkout'}</h1>
				{loading ? (
					<p className="text-[#64736b]" role="status">
						Loading your booking…
					</p>
				) : (
					<div className="overflow-hidden rounded-2xl bg-white shadow-xl">
						{confirmed && (
							<div className="flex items-center gap-3 bg-emerald-50 p-6 text-emerald-800" role="status">
								<CheckCircleIcon className="h-8 w-8" />
								<div>
									<p className="font-bold">Your tickets are booked!</p>
									<p className="mt-1 text-sm">
										{booking.confirmationEmailStatus === 'sent'
											? 'Confirmation email sent to your registered email address.'
											: booking.confirmationEmailStatus === 'failed'
												? 'Email could not be sent. Your tickets are confirmed and available in My Tickets.'
												: 'Your tickets are available in My Tickets. Email confirmation is pending.'}
									</p>
								</div>
							</div>
						)}
						{booking && (
							<div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2">
								<section>
									<p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#31594b]">
										Your movie
									</p>
									<h2 className="text-2xl font-bold text-[#203b38]">{booking.snapshot.movieName}</h2>
									<p className="mt-3 text-gray-700">
										{booking.snapshot.theatreName} · Screen {booking.snapshot.screenNumber}
									</p>
									<p className="mt-1 text-gray-700">
										{new Date(booking.snapshot.startsAt).toLocaleString('en-IN', {
											dateStyle: 'medium',
											timeStyle: 'short'
										})}
									</p>
									<h3 className="mb-2 mt-6 font-semibold">Selected seats</h3>
									<div className="flex flex-wrap gap-2">
										{booking.seats.map((seat) => (
											<span
												key={seat}
												className="rounded border border-[#cbd7cc] bg-[#e7eedf] px-3 py-1 font-semibold text-[#31594b]"
											>
												{seat}
											</span>
										))}
									</div>
									<p className="mt-6 break-all text-xs text-gray-500">
										Booking reference: {booking.reference}
									</p>
								</section>
								<section className="rounded-xl bg-slate-50 p-5">
									<h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
										<TicketIcon className="h-5 w-5" />
										Booking summary
									</h2>
									<div className="flex justify-between text-gray-600">
										<span>
											{booking.seats.length} ticket{booking.seats.length !== 1 ? 's' : ''} ×{' '}
											{money(booking.unitPrice)}
										</span>
										<span>{money(booking.totalAmount)}</span>
									</div>
									<div className="my-5 flex justify-between border-t pt-4 text-xl font-bold">
										<span>Total</span>
										<span>{money(booking.totalAmount)}</span>
									</div>
									{canPay && (
										<p className="mb-4 text-sm text-gray-600">
											Seats reserved for {Math.floor(remaining / 60)}:
											{String(remaining % 60).padStart(2, '0')}
										</p>
									)}
									{confirmed ? (
										<Link className={`${primary} block text-center`} to="/ticket">
											View my tickets
										</Link>
									) : (
										<>
											{expired && (
												<p className="mb-4 text-sm text-amber-800">
													Your seat reservation has expired. Select your seats again to start a new booking.
												</p>
											)}
											{booking.status === 'cancelled' && (
												<p className="mb-4 text-sm text-gray-600">This booking was not completed.</p>
											)}
											{canPay && (
												<button className={primary} onClick={pay} disabled={busy}>
													{busy ? 'Processing…' : `Pay ${money(booking.totalAmount)}`}
												</button>
											)}
											{canPay && (
												<button
													className="mt-3 w-full rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 disabled:opacity-50"
													onClick={cancelBooking}
													disabled={busy}
												>
													Cancel booking
												</button>
											)}
											{(awaitingVerification || booking.razorpayOrderId) && (
												<button
													className="mt-3 w-full rounded-lg border border-[#cbd7cc] px-4 py-2 font-semibold text-[#31594b] disabled:opacity-50"
													onClick={checkStatus}
													disabled={busy}
												>
													{busy ? 'Checking…' : 'Check payment status'}
												</button>
											)}
											{(expired || booking.status === 'cancelled') && !awaitingVerification && (
												<Link
													to={`/showtime/${booking.showtime}`}
													className="mt-4 block text-center font-semibold text-[#31594b]"
												>
													Choose seats again
												</Link>
											)}
											{canPay && (
												<p className="mt-3 text-center text-xs text-gray-500">Payments handled by Razorpay</p>
											)}
										</>
									)}
								</section>
							</div>
						)}
						{error && (
							<p role="alert" className="mx-6 mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
								{error}
							</p>
						)}
						{notice && !confirmed && (
							<p role="status" className="mx-6 mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
								{notice}
							</p>
						)}
						{!booking && (
							<Link to="/theatre" className="m-6 inline-block font-semibold text-[#31594b]">
								Back to theatres
							</Link>
						)}
					</div>
				)}
			</main>
		</div>
	)
}
