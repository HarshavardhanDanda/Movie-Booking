import axios from 'axios'
import React, { useContext, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthContext } from '../context/AuthContext'

const Login = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const { auth, setAuth } = useContext(AuthContext)
	const [errorsMessage, setErrorsMessage] = useState('')
	const [isLoggingIn, SetLoggingIn] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm()

	const onSubmit = async (data) => {
		SetLoggingIn(true)
		try {
			const response = await axios.post('/auth/login', data)
			// console.log(response.data)
			toast.success('Login successful!', {
				position: 'top-center',
				autoClose: 2000,
				pauseOnHover: false
			})
			setAuth((prev) => ({ ...prev, token: response.data.token }))
			const from = location.state?.from
			navigate(typeof from === 'string' && /^\/(checkout|showtime)\/[a-f\d]{24}$/i.test(from) ? from : '/', { replace: true })
		} catch (error) {
			console.error(error.response.data)
			setErrorsMessage(error.response.data)
			toast.error('Error', {
				position: 'top-center',
				autoClose: 2000,
				pauseOnHover: false
			})
		} finally {
			SetLoggingIn(false)
		}
	}

	const inputClasses = () => {
		return 'appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#203b38] focus:outline-none focus:border-[#54766a]'
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#f4f3ee] py-12 px-4 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8 rounded-2xl border border-[#d7ddd5] bg-white p-8 shadow-sm">
				<div>
					<h2 className="mt-4 text-center text-4xl font-extrabold text-[#203b38]">Login</h2>
				</div>
				<form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
					<input
						name="username"
						type="text"
						autoComplete="username"
						{...register('username', { required: true })}
						className={inputClasses`${errors.username ? 'border-red-500' : ''}`}
						placeholder="Username"
					/>
					{errors.username && <span className="text-sm text-red-500">Username is required</span>}
					<input
						name="password"
						type="password"
						autoComplete="current-password"
						{...register('password', { required: true })}
						className={inputClasses`${errors.password ? 'border-red-500' : ''}`}
						placeholder="Password"
					/>
					{errors.password && <span className="text-sm text-red-500">Password is required</span>}

					<div>
						{errorsMessage && <span className="text-sm text-red-500">{errorsMessage}</span>}
						<button
							type="submit"
							className="mt-4 w-full rounded-md bg-[#31594b] py-2 px-4 font-medium text-white drop-shadow-md hover:bg-[#436b5b] focus:outline-none focus:ring-2 focus:ring-[#54766a] focus:ring-offset-2 disabled:bg-[#87958b]"
							disabled={isLoggingIn}
						>
							{isLoggingIn ? 'Processing...' : 'Login'}
						</button>
					</div>
					<p className="text-right">
						Don’t have an account?{' '}
						<Link to={'/register'} className="font-bold text-[#31594b]">
							Register here
						</Link>
					</p>
				</form>
			</div>
		</div>
	)
}

export default Login
