import { CheckIcon } from '@heroicons/react/24/outline'
import { memo } from 'react'

const Seat = ({ seat, setSelectedSeats, selectable, isAvailable, isSelected, isBooked }) => {
	return isBooked || !isAvailable ? (
		<button
			disabled
			aria-label={`${seat.row}${seat.number}: ${isBooked ? 'Booked' : 'On hold'}`}
			title={`${seat.row}${seat.number}: ${isBooked ? 'Booked' : 'On hold'}`}
			className="flex h-8 w-8 cursor-not-allowed items-center justify-center"
		>
			<div className={`h-6 w-6 rounded drop-shadow-md ${isBooked ? 'bg-gray-500' : 'bg-orange-500'}`}></div>
		</button>
	) : isSelected ? (
		<button
			title={`${seat.row}${seat.number}`}
			className="flex h-8 w-8 items-center justify-center"
			onClick={() => {
				setSelectedSeats((prev) => prev.filter((e) => e !== `${seat.row}${seat.number}`))
			}}
		>
			<div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500 drop-shadow-md">
				<CheckIcon className="h-5 w-5 stroke-[3] text-white" />
			</div>
		</button>
	) : (
		<button
			title={`${seat.row}${seat.number}`}
			className={`flex h-8 w-8 items-center justify-center ${!selectable && 'cursor-not-allowed'}`}
			onClick={() => {
				if (selectable) {
					setSelectedSeats((prev) => [...prev, `${seat.row}${seat.number}`])
				}
			}}
		>
			<div className="h-6 w-6 rounded bg-white drop-shadow-md"></div>
		</button>
	)
}

export default memo(Seat)
