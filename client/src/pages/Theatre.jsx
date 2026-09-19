import axios from 'axios'
import './Theatre.css'
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
		<div className="min-h-screen bg-[#f4f3ee] text-[#203b38]">
			<Navbar />
			<main className="theatre-page mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 sm:py-14">
			<header className="border-b border-[#d7ddd5] pb-8"><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Theatres</h1></header>
			<TheatreLists {...props} />
			{theatres[selectedTheatreIndex]?.name && <ScreenListsByTheatre {...props} />}
			</main>
		</div>
	)
}

export default Theatre
