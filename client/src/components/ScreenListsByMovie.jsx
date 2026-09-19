import axios from 'axios'
import { useEffect, useState } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import TheatreLists from './TheatreLists'
import DateSelector from './DateSelector'
import Loading from './Loading'
import ScreenShort from './ScreenShort'

const ScreenListsByMovie = ({ movies, selectedMovieIndex, setSelectedMovieIndex, auth }) => {
	const [selectedDate, setSelectedDate] = useState(
		(sessionStorage.getItem('selectedDate') && new Date(sessionStorage.getItem('selectedDate'))) || new Date()
	)
	const [screens, setScreens] = useState([])
	const [isFetchingScreensDone, setIsFetchingScreensDone] = useState(false)
	const [selectedTheatreIndex, setSelectedTheatreIndex] = useState(
		parseInt(sessionStorage.getItem('selectedTheatreIndex'))
	)
	const [theatres, setTheatres] = useState([])
	const [isFetchingTheatres, setIsFetchingTheatres] = useState(true)

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

	const fetchScreens = async (data) => {
		try {
			setIsFetchingScreensDone(false)
			let response
			if (auth.role === 'admin') {
				response = await axios.get(
					`/screen/movie/unreleased/${
						movies[selectedMovieIndex]._id
					}/${selectedDate.toISOString()}/${new Date().getTimezoneOffset()}`,
					{
						headers: {
							Authorization: `Bearer ${auth.token}`
						}
					}
				)
			} else {
				response = await axios.get(
					`/screen/movie/${
						movies[selectedMovieIndex]._id
					}/${selectedDate.toISOString()}/${new Date().getTimezoneOffset()}`
				)
			}
			setScreens(
				response.data.data.sort((a, b) => {
					if (a.theatre.name > b.theatre.name) return 1
					if (a.theatre.name === b.theatre.name && a.number > b.number) return 1
					return -1
				})
			)
			setIsFetchingScreensDone(true)
		} catch (error) {
			console.error(error)
		}
	}

	useEffect(() => {
		fetchScreens()
	}, [selectedMovieIndex, selectedDate])

	const props = {
		theatres,
		selectedTheatreIndex,
		setSelectedTheatreIndex,
		fetchTheatres,
		auth,
		isFetchingTheatres
	}

	const filteredScreens = screens.filter((screen) => {
		if (selectedTheatreIndex === 0 || !!selectedTheatreIndex) {
			return screen.theatre?.name === theatres[selectedTheatreIndex]?.name
		}
		return true
	})

	return (
		<>
			<TheatreLists {...props} />
			<div className="mx-4 h-fit rounded-2xl border border-[#d7ddd5] bg-white text-[#203b38] drop-shadow-md sm:mx-8">
				<div className="flex flex-col gap-6 p-4 sm:p-6">
					<DateSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
					<div className="flex flex-col gap-4 rounded-md bg-[#f0f3ec] py-4">
						<div className="flex items-center">
							<img src={movies[selectedMovieIndex].img} className="w-32 px-4 drop-shadow-md" />
							<div>
								<h4 className="text-2xl font-semibold">{movies[selectedMovieIndex].name}</h4>
								<p className="text-md font-medium">
									length : {movies[selectedMovieIndex].length || '-'} min
								</p>
							</div>
						</div>
					</div>
					{isFetchingScreensDone ? (
						<div className="flex flex-col">
							{filteredScreens.map((screen, index) => {
								return (
									<div
										key={index}
										className={`flex flex-col ${
											index !== 0 &&
											filteredScreens[index - 1]?.theatre.name !==
												filteredScreens[index].theatre.name &&
											'mt-6'
										}`}
									>
										{filteredScreens[index - 1]?.theatre.name !==
											filteredScreens[index].theatre.name && (
											<div className="rounded-t-md bg-[#203f38] px-2 py-1.5 text-center text-2xl font-semibold text-white sm:py-2">
												<h2>{screen.theatre.name}</h2>
											</div>
										)}
										<ScreenShort
											screenId={screen._id}
											movies={movies}
											selectedDate={selectedDate}
											filterMovie={movies[selectedMovieIndex]}
											rounded={
												index == filteredScreens.length ||
												filteredScreens[index + 1]?.theatre.name !==
													filteredScreens[index].theatre.name
											}
										/>
									</div>
								)
							})}
							{filteredScreens.length === 0 && (
								<p className="text-center text-xl font-semibold text-gray-700">
									There are no showtimes available
								</p>
							)}
						</div>
					) : (
						<Loading />
					)}
				</div>
			</div>
		</>
	)
}

export default ScreenListsByMovie
