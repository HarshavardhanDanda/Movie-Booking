import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Loading from './Loading'
const TheatreLists = ({
	theatres,
	selectedTheatreIndex,
	setSelectedTheatreIndex,
	fetchTheatres,
	auth,
	isFetchingTheatres = false
}) => {
	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors }
	} = useForm()

	const [isAdding, SetIsAdding] = useState(false)

	const onAddTheatre = async (data) => {
		try {
			SetIsAdding(true)
			const response = await axios.post('/theatre', data, {
				headers: {
					Authorization: `Bearer ${auth.token}`
				}
			})
			// console.log(response.data)
			reset()
			fetchTheatres(data.name)
			toast.success('Add theatre successful!', {
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
			SetIsAdding(false)
		}
	}

	const TheatreLists = ({ theatres }) => {
		const theatresList = theatres?.filter((theatre) =>
			theatre.name.toLowerCase().includes(watch('search')?.toLowerCase() || '')
		)

		return theatresList.length ? (
			theatresList.map((theatre, index) => {
				return theatres[selectedTheatreIndex]?._id === theatre._id ? (
					<button
						className="w-fit rounded-md bg-[#203f38] px-2.5 py-1.5 text-lg font-medium text-white shadow-sm"
						onClick={() => {
							setSelectedTheatreIndex(null)
							sessionStorage.setItem('selectedTheatreIndex', null)
						}}
						aria-pressed={theatres[selectedTheatreIndex]?._id === theatre._id}
						data-theatre-option
						key={theatre._id}
					>
						{theatre.name}
					</button>
				) : (
					<button
						className="w-fit rounded-md bg-[#203f38] px-2 py-1 font-medium text-white drop-shadow-md"
						onClick={() => {
							const theatreIndex = theatres.findIndex((item) => item._id === theatre._id)
							setSelectedTheatreIndex(theatreIndex)
							sessionStorage.setItem('selectedTheatreIndex', theatreIndex)
						}}
						aria-pressed={theatres[selectedTheatreIndex]?._id === theatre._id}
						data-theatre-option
						key={theatre._id}
					>
						{theatre.name}
					</button>
				)
			})
		) : (
			<div>No theatres found</div>
		)
	}

	return (
		<>
			<div data-theatre-list
				className="mx-4 flex h-fit flex-col gap-4 rounded-2xl border border-[#d7ddd5] bg-white p-4 text-[#203b38] shadow-sm sm:mx-8 sm:p-6">
				<form
					className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
					onSubmit={handleSubmit(onAddTheatre)}
				>
					<h2 className="text-3xl font-bold">Theatre Lists</h2>
					{auth.role === 'admin' && (
						<div className="flex w-fit grow sm:justify-end">
							<input
								placeholder="Type a theatre name"
								className="w-full grow rounded-l border border-gray-300 px-3 py-1 sm:max-w-xs"
								required
								{...register('name', { required: true })}
							/>
							<button
								disabled={isAdding}
								className="flex items-center whitespace-nowrap rounded-r-md bg-[#31594b] px-2 py-1 font-medium text-white hover:bg-[#436b5b] disabled:bg-[#87958b]"
							>
								{isAdding ? 'Processing...' : 'ADD +'}
							</button>
						</div>
					)}
				</form>
				<div className="relative">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<MagnifyingGlassIcon className="h-5 w-5 stroke-2 text-gray-500" />
					</div>
					<input
						type="search"
						className="block w-full rounded-lg border border-gray-300 p-2 pl-10 text-[#203b38]"
						placeholder="Search theatre"
						{...register('search')}
					/>
				</div>
				{isFetchingTheatres ? (
					<Loading />
				) : (
					<div className="flex flex-wrap items-center gap-3">
						<TheatreLists theatres={theatres} />
					</div>
				)}
			</div>
		</>
	)
}

export default TheatreLists
