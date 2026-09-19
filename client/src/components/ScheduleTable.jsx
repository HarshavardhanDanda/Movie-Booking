import { ArrowsRightLeftIcon, ArrowsUpDownIcon, EyeSlashIcon, UserIcon } from '@heroicons/react/24/outline'
import { useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraggable } from 'react-use-draggable-scroll'
import { AuthContext } from '../context/AuthContext'

const ScheduleTable = ({ theatre, selectedDate }) => {
	const ref = useRef(null)
	const { auth } = useContext(AuthContext)
	const { events } = useDraggable(ref)
	const navigate = useNavigate()

	const getRowStart = (showtime) => {
		showtime = new Date(showtime)
		const hour = showtime.getHours()
		const min = showtime.getMinutes()
		return Math.round((60 * hour + min) / 5)
	}

	const getRowSpan = (length) => {
		return Math.round(length / 5)
	}

	const getRowStartRange = () => {
		let firstRowStart = 100000
		let lastRowEnd = 0
		let count = 0
		theatre.screens.forEach((screen, index) => {
			screen.showtimes.forEach((showtime, index) => {
				if (
					new Date(showtime.showtime).getDate() === selectedDate.getDate() &&
					new Date(showtime.showtime).getMonth() === selectedDate.getMonth() &&
					new Date(showtime.showtime).getYear() === selectedDate.getYear()
				) {
					const rowStart = getRowStart(showtime.showtime)
					if (rowStart < firstRowStart) {
						firstRowStart = rowStart
					}
					if (rowStart + getRowSpan(showtime.movie.length) > lastRowEnd) {
						lastRowEnd = rowStart + getRowSpan(showtime.movie.length)
					}
					count++
				}
			})
		})
		return [firstRowStart, lastRowEnd, count]
	}

	const getTodayShowtimes = (screen) => {
		return screen.showtimes?.filter((showtime, index) => {
			return (
				new Date(showtime.showtime).getDate() === selectedDate.getDate() &&
				new Date(showtime.showtime).getMonth() === selectedDate.getMonth() &&
				new Date(showtime.showtime).getYear() === selectedDate.getYear()
			)
		})
	}

	function rowToNumber(column) {
		let result = 0
		for (let i = 0; i < column.length; i++) {
			const charCode = column.charCodeAt(i) - 64 // Convert character to ASCII and adjust to 1-based index
			result = result * 26 + charCode
		}
		return result
	}

	const firstRowStart = getRowStartRange()[0]
	const gridRows = Math.max(1, getRowStartRange()[1] - getRowStartRange()[0])
	const showtimeCount = getRowStartRange()[2]
	const shiftStart = 3
	const shiftEnd = 2

	const isPast = (date) => {
		return date < new Date()
	}

	return (
		<>
			<div
				className={`grid min-h-[50vh] max-h-screen overflow-x-auto grid-cols-${theatre.screens?.length.toString()} grid-rows-${
					gridRows + shiftEnd
				} rounded-xl border border-[#cbd7cc] bg-[#f4f3ee]`}
				{...events}
				ref={ref}
			>
				{theatre.screens?.map((screen, index) => {
					{
						return getTodayShowtimes(screen)?.map((showtime, index) => {
							return (
								<button
									title={`${showtime.movie.name}\n${new Date(showtime.showtime)
										.getHours()
										.toString()
										.padStart(2, '0')} : ${new Date(showtime.showtime)
										.getMinutes()
										.toString()
										.padStart(2, '0')} - ${new Date(
										new Date(showtime.showtime).getTime() + showtime.movie.length * 60000
									)
										.getHours()
										.toString()
										.padStart(2, '0')} : ${new Date(
										new Date(showtime.showtime).getTime() + showtime.movie.length * 60000
									)
										.getMinutes()
										.toString()
										.padStart(2, '0')}
												`}
									key={index}
									className={`flex flex-col items-center overflow-y-scroll row-span-${getRowSpan(
										showtime.movie.length
									)} row-start-${
										getRowStart(showtime.showtime) - firstRowStart + shiftStart
									} col-start-${screen.number} mx-1 rounded-lg border border-[#cbd7cc] border-l-4 p-3 text-center shadow-sm ${
										!isPast(new Date(showtime.showtime))
											? 'border-l-[#31594b] bg-[#e7eedf] text-[#203f38] hover:bg-[#dce7d6]'
											: `border-l-[#9ba69a] bg-[#eeefea] text-[#64736b] ${
													auth.role === 'admin' ? 'hover:bg-[#e1e5dc]' : 'cursor-not-allowed'
											  }`
									} ${!showtime.isRelease && 'ring-2 ring-inset ring-[#b36a36]'}`}
									onClick={() => {
										if (!isPast(new Date(showtime.showtime)) || auth.role === 'admin')
											return navigate(`/showtime/${showtime._id}`)
									}}
								>
									{!showtime.isRelease && (
										<EyeSlashIcon
											className="mx-auto h-5 w-5 stroke-2"
											title="Unreleased showtime"
										/>
									)}
									<p className="text-sm font-bold">{showtime.movie.name}</p>
									<p className="mt-2 text-xs leading-relaxed">{`${new Date(showtime.showtime)
										.getHours()
										.toString()
										.padStart(2, '0')} : ${new Date(showtime.showtime)
										.getMinutes()
										.toString()
										.padStart(2, '0')} - ${new Date(
										new Date(showtime.showtime).getTime() + showtime.movie.length * 60000
									)
										.getHours()
										.toString()
										.padStart(2, '0')} : ${new Date(
										new Date(showtime.showtime).getTime() + showtime.movie.length * 60000
									)
										.getMinutes()
										.toString()
										.padStart(2, '0')}`}</p>
								</button>
							)
						})
					}
				})}

				{showtimeCount === 0 && (
					<div className="col-span-full row-start-3 flex items-center justify-center text-xl font-semibold text-gray-700">
						There are no showtimes available
					</div>
				)}

				{theatre.screens.map((screen, index) => (
					<div
						key={index}
						className="sticky top-0 z-10 border-r border-[#54766a] row-span-1 row-start-1 flex flex-col items-center justify-center bg-[#203f38] px-3 py-3 text-white"
					>
						<p className="text-2xl font-semibold leading-7">Screen {screen.number}</p>
						{auth.role === 'admin' && (
							<>
								<div className="flex gap-1 text-xs">
									<p className="flex items-center gap-1">
										<ArrowsUpDownIcon className="h-3 w-3" />
										{screen.seatPlan.row === 'A'
											? screen.seatPlan.row
											: `A - ${screen.seatPlan.row}`}
									</p>
									<p className="flex items-center gap-1">
										<ArrowsRightLeftIcon className="h-3 w-3" />
										{screen.seatPlan.column === 1
											? screen.seatPlan.column
											: `1 - ${screen.seatPlan.column}`}
									</p>
								</div>
								<p className="flex items-center gap-1 text-sm">
									<UserIcon className="h-4 w-4" />
									{(rowToNumber(screen.seatPlan.row) * screen.seatPlan.column).toLocaleString(
										'en-US'
									)}{' '}
									Seats
								</p>
							</>
						)}
					</div>
				))}
			</div>
		</>
	)
}

export default ScheduleTable
