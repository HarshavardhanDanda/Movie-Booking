import 'react-toastify/dist/ReactToastify.css'
import Loading from './Loading'

const NowShowing = ({ movies, selectedMovieIndex, setSelectedMovieIndex, auth, isFetchingMoviesDone }) => {
	return (
		<div className="mx-4 flex flex-col rounded-2xl border border-[#d7ddd5] bg-white p-4 text-[#203b38] shadow-sm sm:mx-8 sm:p-6">
			<h2 className="text-3xl font-bold">Now Showing</h2>
			{isFetchingMoviesDone ? (
				movies.length ? (
					<div className="mt-1 overflow-x-auto cursor-pointer sm:mt-3">
						<div className="mx-auto flex w-fit gap-4">
							{movies?.map((movie, index) => {
								return movies[selectedMovieIndex]?._id === movie._id ? (
									<div
										key={index}
										title={movie.name}
										className="flex w-[150px] flex-col rounded-xl border border-[#31594b] bg-[#31594b] p-2 text-white shadow-sm hover:bg-[#436b5b] sm:w-[190px]"
										onClick={() => {
											setSelectedMovieIndex(null)
											sessionStorage.setItem('selectedMovieIndex', null)
										}}
									>
										<img
											alt={movie.name}
											src={movie.img}
											className="h-52 rounded-md object-cover shadow-sm sm:h-64"
										/>
										<p className="break-words px-1 py-3 text-center text-sm font-semibold leading-4">
											{movie.name}
										</p>
									</div>
								) : (
									<div
										key={index}
										className="flex w-[150px] flex-col rounded-2xl border border-[#d7ddd5] bg-white p-2 shadow-sm hover:bg-[#436b5b] hover:text-white sm:w-[190px]"
										onClick={() => {
											setSelectedMovieIndex(index)
											sessionStorage.setItem('selectedMovieIndex', index)
										}}
									>
										<img
											alt={movie.name}
											src={movie.img}
											className="h-52 rounded-md object-cover shadow-sm sm:h-64"
										/>
										<p className="break-words px-1 py-3 text-center text-sm font-semibold leading-4">
											{movie.name}
										</p>
									</div>
								)
							})}
						</div>
					</div>
				) : (
					<p className="mt-4 text-center">There are no movies available</p>
				)
			) : (
				<Loading />
			)}
		</div>
	)
}

export default NowShowing
