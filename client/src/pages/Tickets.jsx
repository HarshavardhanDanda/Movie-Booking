import axios from 'axios'
import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRightIcon, TicketIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Navbar from '../components/Navbar'
import { AuthContext } from '../context/AuthContext'

const Tickets = () => {
	const { auth } = useContext(AuthContext)
	const [tickets, setTickets] = useState([])
	const [now, setNow] = useState(Date.now())
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let active = true
		setLoading(true)
		setError('')
		axios.get('/auth/tickets', { headers: { Authorization: `Bearer ${auth.token}` } })
			.then(({ data }) => { if (active) setTickets(data.data.tickets || []) })
			.catch(() => { if (active) setError('We could not load your tickets. Please refresh to try again.') })
			.finally(() => { if (active) setLoading(false) })
		const timer = setInterval(() => setNow(Date.now()), 1000)
		return () => { active = false; clearInterval(timer) }
	}, [auth.token])

	const sortedTickets = [...tickets].sort((a, b) => {
		const timeA = new Date(a.showtime?.showtime).getTime()
		const timeB = new Date(b.showtime?.showtime).getTime()
		const pastA = !Number.isFinite(timeA) || timeA <= now
		const pastB = !Number.isFinite(timeB) || timeB <= now
		if (pastA !== pastB) return pastA ? 1 : -1
		return pastA ? (timeB || 0) - (timeA || 0) : timeA - timeB
	})
	const upcoming = tickets.filter((ticket) => new Date(ticket.showtime?.showtime).getTime() > now).length

	return (
		<div className="min-h-screen bg-[#f4f3ee] text-[#203b38]">
			<Navbar />
			<main className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
				<header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[#d7ddd5] pb-8">
					<div>
						<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">My tickets<span className="text-[#b36a36]">.</span></h1>
					</div>
					<Link to="/theatre" className="inline-flex items-center gap-3 rounded-full bg-[#203f38] px-5 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#203f38]">
						Browse theatres <ArrowUpRightIcon className="h-4 w-4" />
					</Link>
				</header>
				{loading ? <p role="status" className="py-12 text-center text-[#64736b]">Loading your tickets...</p> : error ? (
					<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">{error}</p>
				) : tickets.length === 0 ? (
					<div className="rounded-2xl border border-[#d7ddd5] bg-white px-6 py-16 text-center">
						<TicketIcon className="mx-auto mb-5 h-10 w-10 text-[#54766a]" />
						<h2 className="text-2xl font-semibold">No tickets yet</h2>
					</div>
				) : (
					<>
						<div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
							<span className="rounded-full bg-[#e1e9e0] px-4 py-2 font-semibold text-[#315445]">{upcoming} upcoming</span>
							<span className="text-[#64736b]">{tickets.length - upcoming} past bookings</span>
						</div>
						<div className="grid items-start gap-6 lg:grid-cols-2">
							{sortedTickets.map((ticket, index) => {
								const show = ticket.showtime
								const date = new Date(show?.showtime)
								const validDate = Number.isFinite(date.getTime())
								// Showtimes indicate expiry, not whether someone attended.
								const expired = validDate && date.getTime() <= now
								const muted = expired || !validDate
								const seats = ticket.seats || []
								return (
									<article key={ticket._id || `${show?._id}-${index}`} className={`overflow-hidden rounded-2xl border ${muted ? 'border-[#dcded8] bg-[#eeefea]' : 'border-[#d5dfd6] bg-white shadow-sm'}`}>
										<div className={`flex items-center justify-between gap-3 px-5 py-3 text-xs font-semibold sm:px-6 ${muted ? 'bg-[#e3e6df] text-[#5e685e]' : 'bg-[#203f38] text-[#e9f0e4]'}`}>
											<span className="flex items-center gap-2 uppercase tracking-[0.18em]"><TicketIcon className="h-4 w-4" /> Movie Booking</span>
											<span className={`rounded-full px-3 py-1 ${muted ? 'bg-white/50' : 'bg-white/10'}`}>{!validDate ? 'Unavailable' : expired ? 'Expired' : 'Upcoming'}</span>
										</div>
										<div className="flex gap-4 p-5 sm:gap-6 sm:p-6">
											<div className={`relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-[#dce2d7] sm:h-44 sm:w-28 ${muted ? 'grayscale' : ''}`}>
												<TicketIcon className="absolute inset-0 m-auto h-8 w-8 text-[#789080]" />
												{show?.movie?.img && <img src={show.movie.img} alt={`${show.movie.name} poster`} loading="lazy" className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} />}
											</div>
											<div className="min-w-0 flex-1">
												<p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#718071]">{show?.movie?.length ? `${show.movie.length} min` : 'Movie ticket'}</p>
												<h2 className={`break-words text-xl font-bold leading-tight sm:text-2xl ${muted ? 'text-[#626c62]' : 'text-[#203f38]'}`}>{show?.movie?.name || 'Movie unavailable'}</h2>
												<p className="mt-3 flex items-start gap-1.5 text-sm text-[#64736b]"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />{show?.screen?.theatre?.name || 'Theatre unavailable'}</p>
												<p className="mt-1 pl-5 text-xs text-[#64736b]">Screen {show?.screen?.number || '-'}</p>
												<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
													<p>{validDate ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable'}</p>
													<p>{validDate && date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
												</div>
											</div>
										</div>
										<div className="relative border-t border-dashed border-[#cdd6cb] px-5 py-5 sm:px-6">
											<span aria-hidden="true" className="absolute -left-2 -top-2 h-4 w-4 rounded-full border border-[#d7ddd5] bg-[#f4f3ee]" />
											<span aria-hidden="true" className="absolute -right-2 -top-2 h-4 w-4 rounded-full border border-[#d7ddd5] bg-[#f4f3ee]" />
											<div className="flex items-start justify-between gap-4">
												<div className="min-w-0"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#64736b]">Your seats</p><div className="flex flex-wrap gap-2">{seats.map((seat) => <span key={`${seat.row}${seat.number}`} className={`rounded-md px-3 py-1 text-sm font-bold ${muted ? 'bg-[#dfe3db] text-[#65705f]' : 'bg-[#e7eedf] text-[#34573a]'}`}>{seat.row}{seat.number}</span>)}</div></div>
												<p className="shrink-0 pt-5 text-xs text-[#64736b]">{seats.length} {seats.length === 1 ? 'ticket' : 'tickets'}</p>
											</div>
											{ticket.reference && <p className="mt-4 break-all font-mono text-[10px] text-[#64736b]">REF {ticket.reference}</p>}
										</div>
									</article>
								)
							})}
						</div>
					</>
				)}
			</main>
		</div>
	)
}

export default Tickets
