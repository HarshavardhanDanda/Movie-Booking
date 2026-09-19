import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { AuthContext } from '../context/AuthContext'

const DateSelector = ({ selectedDate, setSelectedDate }) => {
	const { auth } = useContext(AuthContext)
	const wrapperRef = useRef(null)
	const [isEditing, SetIsEditing] = useState(false)

	const handlePrevDay = () => {
		const prevDay = new Date(selectedDate)
		prevDay.setDate(prevDay.getDate() - 1)
		setSelectedDate(prevDay)
		sessionStorage.setItem('selectedDate', prevDay)
	}

	const handleNextDay = () => {
		const nextDay = new Date(selectedDate)
		nextDay.setDate(nextDay.getDate() + 1)
		setSelectedDate(nextDay)
		sessionStorage.setItem('selectedDate', nextDay)
	}

	const handleToday = () => {
		const today = new Date()
		setSelectedDate(today)
		sessionStorage.setItem('selectedDate', today)
	}

	const formatDate = (date) => {
		const weekday = date.toLocaleString('default', { weekday: 'long' })
		const day = date.getDate()
		const month = date.toLocaleString('default', { month: 'long' })
		const year = date.getFullYear()
		return `${weekday} ${day} ${month} ${year}`
	}

	const DateShort = ({ date, selectedDate }) => {
		const day = date.getDate()
		const weekday = date.toLocaleString('default', { weekday: 'short' })

		const isThisDate =
			selectedDate.getDate() === date.getDate() &&
			selectedDate.getMonth() === date.getMonth() &&
			selectedDate.getFullYear() === date.getFullYear()

		const isToday = new Date(date).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)

		return (
			<button
				title={formatDate(date)}
				className={`flex min-w-[48px] flex-col items-center justify-center rounded p-1 font-semibold ${
					isThisDate
						? 'bg-[#203f38] text-white'
						: isToday
						? 'bg-[#f0f3ec] ring-2 ring-inset ring-[#54766a] hover:bg-white'
						: isPast(date)
						? 'bg-[#69766d] text-white hover:bg-[#54766a]'
						: 'bg-[#f0f3ec] hover:bg-white'
				}`}
				onClick={() => {
					setSelectedDate(date)
					sessionStorage.setItem('selectedDate', date)
				}}
			>
				<p className="text-sm">{weekday}</p>
				<p className="text-xl">{day}</p>
			</button>
		)
	}

	const isPast = (date) => {
		return new Date(date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
	}

	const handleChange = (event) => {
		setSelectedDate(new Date(event.target.value))
	}

	function generateDateRange(startDate, endDate) {
		const dates = []
		const currentDate = new Date(startDate)

		while (currentDate <= endDate) {
			dates.push(new Date(currentDate.getTime()))
			currentDate.setDate(currentDate.getDate() + 1)
		}

		return dates
	}

	function getPastAndNextDateRange() {
		const today = new Date()
		const pastDays = new Date(today)
		if (auth.role === 'admin') {
			pastDays.setDate(today.getDate() - 7)
		}

		const nextDays = new Date(today)
		nextDays.setDate(today.getDate() + 14)

		return generateDateRange(pastDays, nextDays)
	}

	useEffect(() => {
		document.addEventListener('click', handleClickOutside, false)
		return () => {
			document.removeEventListener('click', handleClickOutside, false)
		}
	}, [])

	const handleClickOutside = (event) => {
		if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
			SetIsEditing(false)
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="relative flex items-stretch justify-between gap-2 rounded-md bg-[#203f38] p-2 font-semibold text-white">
				{auth.role === 'admin' || !isPast(new Date().setDate(selectedDate.getDate() - 1)) ? (
					<button
						title="Go to yesterday"
						className={'rounded hover:bg-[#436b5b]'}
						onClick={handlePrevDay}
					>
						<ChevronLeftIcon className="h-10 w-10 text-white" />
					</button>
				) : (
					<div className="h-10 w-10"></div>
				)}

				{isEditing ? (
					<div className="w-full" ref={wrapperRef}>
						<input
							title="Select date"
							type="Date"
							min={auth.role !== 'admin' && new Date().toLocaleDateString('en-CA')}
							required
							autoFocus
							className={`w-full rounded border border-white bg-[#203f38] px-1 text-center text-2xl font-semibold drop-shadow-sm sm:text-3xl`}
							value={selectedDate.toLocaleDateString('en-CA')}
							onChange={handleChange}
							style={{ colorScheme: 'dark' }}
						/>
					</div>
				) : (
					<div
						className="flex w-full items-center justify-center rounded text-center text-xl hover:bg-[#436b5b] sm:text-2xl"
						onClick={() => {
							SetIsEditing(true)
						}}
					>
						{formatDate(selectedDate)}
					</div>
				)}

				<div className="flex items-center justify-between gap-2">
					<button
						title="Go to tomorrow"
						className="rounded hover:bg-[#436b5b]"
						onClick={handleNextDay}
					>
						<ChevronRightIcon className="h-10 w-10 text-white" />
					</button>
					<button
						title="Go to today"
						className="rounded px-1 hover:bg-[#436b5b]"
						onClick={handleToday}
					>
						<ArrowPathIcon className="h-10 w-10 text-white" />
					</button>
				</div>
			</div>
			<div className="flex gap-2 overflow-auto pb-2 [&::-webkit-scrollbar]:h-1.5">
				{getPastAndNextDateRange().map((date, index) => (
					<DateShort key={index} date={date} selectedDate={selectedDate} />
				))}
			</div>
		</div>
	)
}

export default DateSelector
