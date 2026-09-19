import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'

const MovieLists = ({ movies, search, handleDelete, handleEdit, busy }) => {
	const moviesList = movies?.filter((movie) => movie.name.toLowerCase().includes(search?.toLowerCase() || ''))

	return !!moviesList.length ? (
		<div className="grid grid-cols-1 gap-4 rounded-md bg-[#f0f3ec] p-4 drop-shadow-md lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1920px]:grid-cols-5">
			{moviesList.map((movie, index) => {
				return (
					<div key={index} className="flex min-w-fit flex-grow rounded-2xl border border-[#d7ddd5] bg-white drop-shadow-md">
						<img src={movie.img} className="h-36 rounded-md object-contain drop-shadow-md sm:h-48" />
						<div className="flex flex-grow flex-col justify-between p-2">
							<div>
								<p className="text-lg font-semibold sm:text-xl">{movie.name}</p>
								<p>length : {movie.length || '-'} min.</p>
							</div>
							<div className="mt-3 flex flex-wrap justify-end gap-2">
								<button type="button" disabled={busy} onClick={() => handleEdit(movie)} className="flex items-center gap-1 rounded-md bg-[#31594b] px-2 py-1 text-sm font-medium text-white disabled:opacity-50">
									Edit <PencilSquareIcon className="h-5 w-5" />
								</button>
							<button disabled={busy}
								className="flex w-fit items-center gap-1 self-end rounded-md bg-[#a13f35] py-1 pl-2 pr-1.5 text-sm font-medium text-white hover:bg-[#87362e]"
								onClick={() => handleDelete(movie)}
							>
								DELETE
								<TrashIcon className="h-5 w-5" />
							</button>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	) : (
		<div>No movies found</div>
	)
}

export default MovieLists
