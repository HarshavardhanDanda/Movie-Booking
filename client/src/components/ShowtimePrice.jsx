import axios from 'axios'
import { useContext, useState } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function ShowtimePrice({ showtime, onSaved }) {
	const { auth } = useContext(AuthContext)
	const [price, setPrice] = useState(showtime.ticketPrice ? (showtime.ticketPrice / 100).toFixed(2) : '')
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState('')
	async function save(event) {
		event.preventDefault()
		setSaving(true)
		setMessage('')
		try {
			// Admins enter rupees; the API stores integer paise.
			await axios.put(
				`/showtime/${showtime._id}`,
				{ ticketPrice: Math.round(Number(price) * 100) },
				{
					headers: { Authorization: `Bearer ${auth.token}` }
				}
			)
			await onSaved()
			setMessage('Ticket price saved.')
		} catch (err) {
			setMessage(err.response?.data?.message || 'Could not save the price.')
		} finally {
			setSaving(false)
		}
	}
	return (
		<form onSubmit={save} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-white/80 p-3">
			<label className="flex flex-col gap-1 text-sm font-semibold">
				Ticket price (₹)
				<input
					type="number"
					min="1"
					step="0.01"
					required
					value={price}
					onChange={(event) => setPrice(event.target.value)}
					placeholder="150.00"
					className="w-32 rounded border border-gray-300 px-3 py-2"
				/>
			</label>
			<button
				disabled={saving}
				className="rounded bg-[#203f38] px-4 py-2 font-semibold text-white disabled:opacity-50"
			>
				{saving ? 'Saving…' : 'Save price'}
			</button>
			{message && (
				<p role="status" className="py-2 text-sm">
					{message}
				</p>
			)}
		</form>
	)
}
