export default function TicketPriceField({ register }) {
	return (
		<label className="flex flex-col gap-1 font-semibold">
			Ticket price (₹)
			<input
				type="number"
				min="1"
				step="0.01"
				required
				placeholder="150.00"
				className="h-9 w-32 rounded border border-gray-300 bg-white px-2 py-1 text-gray-900"
				{...register('ticketPrice', { required: true, min: 1, valueAsNumber: true })}
			/>
		</label>
	)
}
