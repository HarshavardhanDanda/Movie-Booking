import GoogleSignIn from '../components/GoogleSignIn'
import axios from 'axios'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const Register = () => {
	const navigate = useNavigate()
	const [errorsMessage, setErrorsMessage] = useState('')
	const [isRegistering, SetIsRegistering] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm()

	const onSubmit = async (data) => {
		SetIsRegistering(true)
		try {
			const response = await axios.post('/auth/register', data)
			// console.log(response.data)
			toast.success('Registration successful!', {
				position: 'top-center',
				autoClose: 2000,
				pauseOnHover: false
			})
			navigate('/')
		} catch (error) {
			console.error(error.response.data)
			setErrorsMessage(error.response.data)
			toast.error('Error', {
				position: 'top-center',
				autoClose: 2000,
				pauseOnHover: false
			})
		} finally {
			SetIsRegistering(false)
		}
	}

	const inputClasses = () => {
		return 'appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-[#203b38] focus:outline-none focus:border-[#54766a]'
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#f4f3ee] py-12 px-4 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8 rounded-2xl border border-[#d7ddd5] bg-white p-8 shadow-sm">
				<div>
					<h2 className="mt-4 text-center text-4xl font-extrabold text-[#203b38]">Register</h2>
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
						name="email"
						type="email"
						autoComplete="email"
						{...register('email', { required: true })}
						className={inputClasses`${errors.email ? 'border-red-500' : ''}`}
						placeholder="Email"
					/>
					{errors.username && <span className="text-sm text-red-500">Email is required</span>}
					<input
						name="password"
						type="password"
						autoComplete="current-password"
						{...register('password', {
							required: 'Password is required',
							minLength: {
								value: 6,
								message: 'Password must be at least 6 characters long'
							}
						})}
						className={inputClasses`${errors.password ? 'border-red-500' : ''}`}
						placeholder="Password"
					/>
					{errors.password && <span className="text-sm text-red-500">{errors.password?.message}</span>}
					<div>
						{errorsMessage && <span className="text-sm text-red-500">{errorsMessage}</span>}
						<button
							type="submit"
							className="mt-4 w-full rounded-md bg-[#31594b] py-2 px-4 font-medium text-white drop-shadow-md hover:bg-[#436b5b] focus:outline-none focus:ring-2 focus:ring-[#54766a] focus:ring-offset-2 disabled:bg-[#87958b]"
							disabled={isRegistering}
						>
							{isRegistering ? 'Processing...' : 'Register'}
						</button>
					</div>
					<p className="text-center">
						Already have an account?{' '}
						<Link to={'/login'} className="font-bold text-[#31594b]">
							Login here
						</Link>
					</p>
				</form>
				<GoogleSignIn />
			</div>
		</div>
	)
}

export default Register
