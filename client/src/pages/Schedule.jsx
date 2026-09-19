import '../components/Screen.css'
import TicketPriceField from '../components/TicketPriceField'
import axios from 'axios'
import { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Select from 'react-tailwindcss-select'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import TheatreLists from '../components/TheatreLists'
import DateSelector from '../components/DateSelector'
import Loading from '../components/Loading'
import Navbar from '../components/Navbar'
import ScheduleTable from '../components/ScheduleTable'
import { AuthContext } from '../context/AuthContext'

const Schedule = () => {
	const { auth } = useContext(AuthContext)
	const {
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors }
	} = useForm()
	const [selectedDate, setSelectedDate] = useState(
		(sessionStorage.getItem('selectedDate') && new Date(sessionStorage.getItem('selectedDate'))) || new Date()
	)
	const [selectedTheatreIndex, setSelectedTheatreIndex] = useState(
		parseInt(sessionStorage.getItem('selectedTheatreIndex')) || 0
	)
	const [theatres, setTheatres] = useState([])
	const [isFetchingTheatres, setIsFetchingTheatres] = useState(true)
	const [movies, setMovies] = useState()
	const [isAddingShowtime, SetIsAddingShowtime] = useState(false)
	const [selectedMovie, setSelectedMovie] = useState(null)

	const fetchTheatres = async (data) => {
		try {
			setIsFetchingTheatres(true)
			let response
			if (auth.role === 'admin') {
				response = await axios.get('/theatre/unreleased', {
					headers: {
						Authorization: `Bearer ${auth.token}`
					}
				})
			} else {
				response = await axios.get('/theatre')
			}
			// console.log(response.data.data)
			setTheatres(response.data.data)
		} catch (error) {
			console.error(error)
		} finally {
			setIsFetchingTheatres(false)
		}
	}

	useEffect(() => {
		fetchTheatres()
	}, [])

	const fetchMovies = async (data) => {
		try {
			const response = await axios.get('/movie')
			// console.log(response.data.data)
			setMovies(response.data.data)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchMovies()
	}, [])

	useEffect(() => {
		setValue('autoIncrease', false)
		setValue('rounding5', true)
		setValue('gap', '00:10')
	}, [])

	const onAddShowtime = async (data) => {
		try {
			SetIsAddingShowtime(true)
			if (!data.movie) {
				toast.error('Please select a movie', {
					position: 'top-center',
					autoClose: 2000,
					pauseOnHover: false
				})
				return
			}
			let showtime = new Date(selectedDate)
			const [hours, minutes] = data.showtime.split(':')
			showtime.setHours(hours, minutes, 0)
			const response = await axios.post(
				'/showtime',
				{ movie: data.movie, showtime, screen: data.screen, repeat: Number(data.repeat), isRelease: data.isRelease, ticketPrice: Math.round(data.ticketPrice * 100) },
				{
					headers: {
						Authorization: `Bearer ${auth.token}`
					}
				}
			)
			// console.log(response.data)
			fetchTheatres()
			if (data.autoIncrease) {
				const movieLength = movies.find((movie) => movie._id === data.movie).length
				const [GapHours, GapMinutes] = data.gap.split(':').map(Number)
				const nextShowtime = new Date(showtime.getTime() + (movieLength + GapHours * 60 + GapMinutes) * 60000)
				if (data.rounding5 || data.rounding10) {
					const totalMinutes = nextShowtime.getHours() * 60 + nextShowtime.getMinutes()
					const roundedMinutes = data.rounding5
						? Math.ceil(totalMinutes / 5) * 5
						: Math.ceil(totalMinutes / 10) * 10
					let roundedHours = Math.floor(roundedMinutes / 60)
					const remainderMinutes = roundedMinutes % 60
					if (roundedHours === 24) {
						nextShowtime.setDate(nextShowtime.getDate() + 1)
						roundedHours = 0
					}
					setValue(
						'showtime',
						`${String(roundedHours).padStart(2, '0')}:${String(remainderMinutes).padStart(2, '0')}`
					)
				} else {
					setValue(
						'showtime',
						`${String(nextShowtime.getHours()).padStart(2, '0')}:${String(
							nextShowtime.getMinutes()
						).padStart(2, '0')}`
					)
				}
				if (data.autoIncreaseDate) {
					setSelectedDate(nextShowtime)
					sessionStorage.setItem('selectedDate', nextShowtime)
				}
			}
			toast.success('Add showtime successful!', {
				position: 'top-center',
				autoClose: 2000,
				pauseOnHover: false
			})
		} catch (error) {
			console.error(error)
			toast.error('Error', {
				position: 'top-center',
				autoClose: 2000,
				pauseOnHover: false
			})
		} finally {
			SetIsAddingShowtime(false)
		}
	}

	const props = {
		theatres,
		selectedTheatreIndex,
		setSelectedTheatreIndex,
		fetchTheatres,
		auth,
		isFetchingTheatres
	}

	return (
		<div className="flex min-h-screen flex-col gap-4 bg-[#f4f3ee] pb-8 text-[#203b38] sm:gap-8">
			<Navbar />
			<TheatreLists {...props} />
			{selectedTheatreIndex !== null &&
				(theatres[selectedTheatreIndex]?.screens?.length ? (
					<div className="mx-4 flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm sm:mx-8 sm:gap-4 sm:p-6">
						<h2 className="text-3xl font-bold text-[#203b38]">Schedule</h2>
						<DateSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
						{auth.role === 'admin' && (
							<form
								className="showtime-form schedule-showtime-form"
								onSubmit={handleSubmit(onAddShowtime)}
							>
								<div className="flex min-w-0 flex-col gap-3">
									<h3 className="text-base font-semibold text-[#203f38]">Create showtime</h3>
<div className="showtime-fields">
										<div className="flex grow items-center gap-x-2 gap-y-1 lg:flex-col lg:items-start">
											<label className="whitespace-nowrap text-lg font-semibold leading-5">
												Screen:
											</label>
											<select
												className="h-9 w-full rounded bg-white px-2 py-1 font-semibold text-[#203b38] drop-shadow-sm"
												required
												{...register('screen', { required: true })}
											>
												<option value="" defaultValue>
													Choose a screen
												</option>
												{theatres[selectedTheatreIndex].screens?.map((screen, index) => {
													return (
														<option key={index} value={screen._id}>
															{screen.number}
														</option>
													)
												})}
											</select>
										</div>
										<div className="flex grow-[2] items-center gap-x-2 gap-y-1 lg:flex-col lg:items-start">
											<label className="whitespace-nowrap text-lg font-semibold leading-5">
												Movie:
											</label>
											<Select
												value={selectedMovie}
												options={movies?.map((movie) => ({
													value: movie._id,
													label: movie.name
												}))}
												onChange={(value) => {
													setValue('movie', value.value)
													setSelectedMovie(value)
												}}
												isSearchable={true}
												primaryColor="teal"
												classNames={{
													searchBox: 'movie-search-input w-full rounded-lg border border-[#cbd7cc] bg-white py-2 pl-9 pr-3 text-sm text-[#203b38]',
													listItem: ({ isSelected }) => `block cursor-pointer rounded-lg px-3 py-2 text-sm ${isSelected ? 'bg-[#203f38] text-white' : 'text-[#203b38] hover:bg-[#e7eedf]'}`,
													menuButton: (value) =>
														'flex font-semibold text-sm border border-gray-300 rounded shadow-sm focus:outline-none bg-white hover:border-gray-400 focus:border-[#54766a] focus:ring focus:ring-[#54766a]/20'
												}}
											/>
										</div>
										<div className="flex items-center gap-x-2 gap-y-1 lg:flex-col lg:items-start">
											<label className="whitespace-nowrap text-lg font-semibold leading-5">
												Showtime:
											</label>
											<input
												type="time"
												className="h-9 w-full rounded bg-white px-2 py-1 font-semibold text-[#203b38] drop-shadow-sm"
												required
												{...register('showtime', { required: true })}
											/>
										</div>
									</div>
									<div className="showtime-fields">
										<div className="flex items-center gap-x-2 gap-y-1 lg:flex-col lg:items-start">
											<label className="whitespace-nowrap text-lg font-semibold leading-5">
												Repeat (Day):
											</label>
											<input
												type="number"
												min={1}
												defaultValue={1}
												max={31}
												className="h-9 w-full rounded bg-white px-2 py-1 font-semibold text-[#203b38] drop-shadow-sm"
												required
												{...register('repeat', { required: true, valueAsNumber: true })}
											/>
										</div>
										<TicketPriceField register={register} />
										<label className="flex items-center gap-x-2 gap-y-1 whitespace-nowrap text-lg font-semibold leading-5 lg:flex-col lg:items-start">
											Release now:
											<input
												type="checkbox"
												className="h-6 w-6 lg:h-9 lg:w-9"
												{...register('isRelease')}
											/>
										</label>
										</div>
<section className="scheduling-options">
<h4 className="mb-2 text-base font-semibold text-[#203f38]">Scheduling options</h4>
<div className="showtime-fields">
<div className="flex flex-col items-start gap-2 lg:flex-row lg:items-end">
											<p className="text-sm font-semibold text-[#64736b]">Auto increase</p>
											<label
												className="flex items-center gap-x-2 gap-y-1 whitespace-nowrap font-semibold leading-5 lg:flex-col lg:items-start"
												title="After add, update showtime value to the movie ending time"
											>
												Showtime:
												<input
													type="checkbox"
													className="h-6 w-6 lg:h-9 lg:w-9"
													{...register('autoIncrease')}
												/>
											</label>
											<label
												className="flex items-center gap-x-2 gap-y-1 whitespace-nowrap font-semibold leading-5 lg:flex-col lg:items-start"
												title="After add, update date value to the movie ending time"
											>
												Date:
												<input
													type="checkbox"
													className="h-6 w-6 lg:h-9 lg:w-9"
													disabled={!watch('autoIncrease')}
													{...register('autoIncreaseDate')}
												/>
											</label>
										</div>
										<div
											className="flex items-center gap-x-2 gap-y-1 lg:flex-col lg:items-start"
											title="Gap between showtimes"
										>
											<label className="whitespace-nowrap font-semibold leading-5">Gap:</label>
											<input
												type="time"
												className="h-9 w-full rounded bg-white px-2 py-1 font-semibold text-[#203b38] drop-shadow-sm disabled:bg-gray-300"
												disabled={!watch('autoIncrease')}
												{...register('gap')}
											/>
										</div>
										<div className="flex flex-col items-start gap-2 lg:flex-row lg:items-end">
											<p className="text-sm font-semibold text-[#64736b]">Rounding</p>
											<label
												className="flex items-center gap-x-2 gap-y-1 whitespace-nowrap font-semibold leading-5 lg:flex-col lg:items-start"
												title="Rounding up to the nearest five minutes"
											>
												5-min:
												<input
													type="checkbox"
													className="h-6 w-6 lg:h-9 lg:w-9"
													disabled={!watch('autoIncrease')}
													{...register('rounding5', {
														onChange: () => setValue('rounding10', false)
													})}
												/>
											</label>
											<label
												className="flex items-center gap-x-2 gap-y-1 whitespace-nowrap font-semibold leading-5 lg:flex-col lg:items-start"
												title="Rounding up to the nearest ten minutes"
											>
												10-min:
												<input
													type="checkbox"
													className="h-6 w-6 lg:h-9 lg:w-9"
													disabled={!watch('autoIncrease')}
													{...register('rounding10', {
														onChange: () => setValue('rounding5', false)
													})}
												/>
											</label>
										</div>
									</div>
</section>
								</div>
								<button
									title="Add showtime"
									disabled={isAddingShowtime}
									className="justify-self-end rounded-lg bg-[#31594b] px-6 py-3 font-semibold text-white hover:bg-[#436b5b] disabled:bg-[#87958b]"
									type="submit"
								>
									{isAddingShowtime ? 'Adding...' : 'Add showtime'}
								</button>
							</form>
						)}
						{isFetchingTheatres ? (
							<Loading />
						) : (
							<div>
								<h2 className="text-2xl font-bold">Screens</h2>
								{theatres[selectedTheatreIndex]?._id && (
									<ScheduleTable
										theatre={theatres[selectedTheatreIndex]}
										selectedDate={selectedDate}
										auth={auth}
									/>
								)}
							</div>
						)}
					</div>
				) : (
					<div className="mx-4 flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm sm:mx-8 sm:gap-4 sm:p-6">
						<p className="text-center">There are no screens available</p>
					</div>
				))}
		</div>
	)
}

export default Schedule
