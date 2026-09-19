import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { useContext, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import Loading from '../components/Loading'
import MovieLists from '../components/MovieLists'
import Navbar from '../components/Navbar'
import { AuthContext } from '../context/AuthContext'

const Movie = () => {
	const { auth } = useContext(AuthContext)
	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors }
	} = useForm()

	const formRef = useRef(null)
	const [editingMovieId, setEditingMovieId] = useState(null)
	const [movies, setMovies] = useState([])
	const [isFetchingMoviesDone, setIsFetchingMoviesDone] = useState(false)
	const [isAddingMovie, SetIsAddingMovie] = useState(false)

	const fetchMovies = async (data) => {
		try {
			setIsFetchingMoviesDone(false)
			const response = await axios.get('/movie')
			// console.log(response.data.data)
			setMovies(response.data.data)
		} catch (error) {
			console.error(error)
		} finally {
			setIsFetchingMoviesDone(true)
		}
	}

	useEffect(() => {
		fetchMovies()
	}, [])

	const cancelEdit = () => {
		setEditingMovieId(null)
		reset({ name: '', img: '', description: '', lengthHr: '', lengthMin: '', search: watch('search') || '' })
	}

	const handleEdit = (movie) => {
		if (isAddingMovie) return
		setEditingMovieId(movie._id)
		reset({ name: movie.name, img: movie.img, description: movie.description || '', lengthHr: Math.floor(movie.length / 60), lengthMin: movie.length % 60, search: watch('search') || '' })
		formRef.current?.scrollIntoView({ block: 'start' })
		formRef.current?.querySelector('input[name="name"]')?.focus({ preventScroll: true })
	}

	const onAddMovie = async (data) => {
		if (isAddingMovie) return
		try {
			data.length = (parseInt(data.lengthHr) || 0) * 60 + (parseInt(data.lengthMin) || 0)
			SetIsAddingMovie(true)
			const response = await axios({
				method: editingMovieId ? 'put' : 'post',
				url: editingMovieId ? `/movie/${editingMovieId}` : '/movie',
				data: { name: data.name, img: data.img, description: data.description, length: data.length },
				headers: {
					Authorization: `Bearer ${auth.token}`
				}
			})
			// console.log(response.data)
			setMovies((current) => editingMovieId ? current.map((movie) => movie._id === editingMovieId ? response.data.data : movie) : [response.data.data, ...current])
			toast.success(editingMovieId ? 'Movie updated' : 'Movie added', {
				position: 'top-center',
				autoClose: 2000,
				pauseOnHover: false
			})
			cancelEdit()
		} catch (error) {
			console.error(error)
			toast.error('Unable to save changes. Please try again.', {
				position: 'top-center',
				autoClose: 2000,
				pauseOnHover: false
			})
		} finally {
			SetIsAddingMovie(false)
		}
	}

	const handleDelete = (movie) => {
		const confirmed = window.confirm(
			`Do you want to delete movie ${movie.name}, including its showtimes and tickets?`
		)
		if (confirmed) {
			onDeleteMovie(movie._id)
		}
	}

	const onDeleteMovie = async (id) => {
		try {
			const response = await axios.delete(`/movie/${id}`, {
				headers: {
					Authorization: `Bearer ${auth.token}`
				}
			})
			// console.log(response.data)
			if (editingMovieId === id) cancelEdit()
			fetchMovies()
			toast.success('Delete movie successful!', {
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
		}
	}

	const inputHr = parseInt(watch('lengthHr')) || 0
	const inputMin = parseInt(watch('lengthMin')) || 0
	const sumMin = inputHr * 60 + inputMin
	const hr = Math.floor(sumMin / 60)
	const min = sumMin % 60

	return (
		<div className="flex min-h-screen flex-col gap-4 bg-[#f4f3ee] pb-8 text-[#203b38] sm:gap-8">
			<Navbar />
			<div className="mx-4 flex h-fit flex-col gap-4 rounded-2xl border border-[#d7ddd5] bg-white p-4 shadow-sm sm:mx-8 sm:p-6">
				<h2 className="text-3xl font-bold text-[#203b38]">Movie Lists</h2>
				<form
					ref={formRef}
					onSubmit={handleSubmit(onAddMovie)}
					className="flex flex-col items-stretch justify-end gap-x-4 gap-y-2 rounded-md bg-[#f0f3ec] p-4 drop-shadow-md lg:flex-row"
				>
					<div className="flex w-full grow flex-col flex-wrap justify-start gap-4 lg:w-auto">
						<div className="flex items-center justify-between gap-4">
							<h3 className="text-xl font-bold">{editingMovieId ? 'Edit Movie' : 'Add Movie'}</h3>
							{editingMovieId && <button type="button" disabled={isAddingMovie} onClick={cancelEdit} className="rounded-lg border border-[#cbd7cc] px-3 py-2 text-sm font-semibold disabled:opacity-50">Cancel edit</button>}
						</div>
						<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
							<label className="text-lg font-semibold leading-5">Name :</label>
							<input
								type="text"
								required
								className="w-full flex-grow rounded px-3 py-1 font-semibold drop-shadow-sm sm:w-auto"
								{...register('name', {
									required: true
								})}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<label htmlFor="movie-description" className="text-lg font-semibold leading-5">Description (optional):</label>
							<textarea
								id="movie-description"
								rows={4}
								maxLength={2000}
								className="w-full resize-y rounded-lg border border-[#cbd7cc] bg-white px-3 py-2 text-[#203b38]"
								{...register('description', { maxLength: 2000 })}
							/>
							<p className="text-right text-xs text-[#64736b]">{watch('description')?.length || 0}/2000</p>
						</div>
						<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
							<label className="text-lg font-semibold leading-5">Poster URL :</label>
							<input
								type="text"
								required
								className="w-full flex-grow rounded px-3 py-1 font-semibold drop-shadow-sm sm:w-auto"
								{...register('img', {
									required: true
								})}
							/>
						</div>
						<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
							<label className="text-lg font-semibold leading-5">Length (hr.):</label>
							<input
								type="number"
								min="0"
								max="20"
								maxLength="2"
								className="w-full flex-grow rounded px-3 py-1 font-semibold drop-shadow-sm sm:w-auto"
								{...register('lengthHr')}
							/>
						</div>
						<div>
							<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
								<label className="text-lg font-semibold leading-5">Length (min.):</label>
								<input
									type="number"
									min="0"
									max="2000"
									maxLength="4"
									required
									className="w-full flex-grow rounded px-3 py-1 font-semibold drop-shadow-sm sm:w-auto"
									{...register('lengthMin', {
										required: true
									})}
								/>
							</div>
							<div className="pt-1 text-right">{`${hr}h ${min}m / ${sumMin}m `}</div>
						</div>
					</div>
					<div className="flex w-full flex-col gap-4 lg:w-auto lg:flex-row">
						{watch('img') && (
							<img src={watch('img')} className="h-48 rounded-md object-contain drop-shadow-md lg:h-64" />
						)}
						<button
							className="w-full min-w-fit items-center rounded-md bg-[#31594b] px-2 py-1 text-center font-medium text-white drop-shadow-md hover:bg-[#436b5b] disabled:bg-[#87958b] lg:w-24 xl:w-32 xl:text-xl"
							type="submit"
							disabled={isAddingMovie}
						>
							{isAddingMovie ? 'Saving...' : editingMovieId ? 'Save changes' : 'ADD +'}
						</button>
					</div>
				</form>
				<div className="relative drop-shadow-sm">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<MagnifyingGlassIcon className="h-5 w-5 stroke-2 text-gray-500" />
					</div>
					<input
						type="search"
						className="block w-full rounded-lg border border-gray-300 p-2 pl-10 text-[#203b38]"
						placeholder="Search movie"
						{...register('search')}
					/>
				</div>
				{isFetchingMoviesDone ? (
					<MovieLists movies={movies} search={watch('search')} handleDelete={handleDelete} handleEdit={handleEdit} busy={isAddingMovie} />
				) : (
					<Loading />
				)}
			</div>
		</div>
	)
}

export default Movie
