import axios from 'axios'
import { useContext, useEffect, useState } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import TheatreLists from '../components/TheatreLists'
import Navbar from '../components/Navbar'
import ScreenListsByTheatre from '../components/ScreenListsByTheatre'
import { AuthContext } from '../context/AuthContext'

const Theatre = () => {
	const { auth } = useContext(AuthContext)
	const [selectedTheatreIndex, setSelectedTheatreIndex] = useState(
		parseInt(sessionStorage.getItem('selectedTheatreIndex')) || 0
	)
	const [theatres, setTheatres] = useState([])
	const [isFetchingTheatres, setIsFetchingTheatres] = useState(true)

	const fetchTheatres = async (newSelectedTheatre) => {
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
			if (newSelectedTheatre) {
				response.data.data.map((theatre, index) => {
					if (theatre.name === newSelectedTheatre) {
						setSelectedTheatreIndex(index)
						sessionStorage.setItem('selectedTheatreIndex', index)
					}
				})
			}
		} catch (error) {
			console.error(error)
		} finally {
			setIsFetchingTheatres(false)
		}
	}

	useEffect(() => {
		fetchTheatres()
	}, [])

	const props = {
		theatres,
		selectedTheatreIndex,
		setSelectedTheatreIndex,
		fetchTheatres,
		auth,
		isFetchingTheatres
	}
	return (
		<div className="flex min-h-screen flex-col gap-4 bg-gradient-to-br from-indigo-900 to-blue-500 pb-8 sm:gap-8">
			<Navbar />
			<TheatreLists {...props} />
			{theatres[selectedTheatreIndex]?.name && <ScreenListsByTheatre {...props} />}
		</div>
	)
}

export default Theatre
