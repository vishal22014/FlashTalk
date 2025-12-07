import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {

  const [currState, setCurrState] = useState("Sign up")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext)

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (currState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return;
    }

    login(currState === "Sign up" ? 'signup' : 'login', { fullName, email, password, bio })
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 sm:p-8 backdrop-blur-3xl overflow-hidden relative'>

      {/* Background Decorative Elements */}


      <div className="flex w-full max-w-5xl items-center justify-around gap-12 max-md:flex-col relative z-10">

        {/* -------- left (Logo & Branding) -------- */}
        <div className="flex flex-col items-center text-center gap-1 animate-fade-in-up -translate-x-6 -translate-y-8">
          <div className="flex items-center gap-2 drop-shadow-2xl hover:scale-105 transition-transform duration-500">
            <img src={assets.logo_icon} alt="FlashTalk Icon" className='w-24 h-24 md:w-28 md:h-28' />
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">FlashTalk</h1>
          </div>
          <p className="text-xl text-gray-200 font-light tracking-wide ml-12">
            Connect instantly, chat seamlessly.
          </p>
        </div>

        {/* -------- right (Form) -------- */}
        <form onSubmit={onSubmitHandler} className='w-full max-w-md bg-white/10 p-8 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md flex flex-col gap-6 animate-fade-in-up delay-100'>

          <div className="flex flex-col gap-1">
            <h2 className='text-3xl font-bold text-white tracking-tight flex items-center justify-between'>
              {currState}
              {isDataSubmitted &&
                <button type="button" onClick={() => setIsDataSubmitted(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                  <img src={assets.arrow_icon} alt="Back" className='w-4 invert' />
                </button>
              }
            </h2>
            <p className="text-sm text-gray-300">
              {currState === "Sign up" ? "Join the community today" : "Welcome back, we missed you!"}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {currState === "Sign up" && !isDataSubmitted && (
              <div className="group relative">
                <input onChange={(e) => setFullName(e.target.value)} value={fullName}
                  type="text" className='w-full p-3 pl-4 bg-black/20 text-white border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder-gray-400' placeholder="Full Name" required />
              </div>
            )}

            {!isDataSubmitted && (
              <>
                <input onChange={(e) => setEmail(e.target.value)} value={email}
                  type="email" placeholder='Email Address' required className='w-full p-3 pl-4 bg-black/20 text-white border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder-gray-400' />
                <input onChange={(e) => setPassword(e.target.value)} value={password}
                  type="password" placeholder='Password' required className='w-full p-3 pl-4 bg-black/20 text-white border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder-gray-400' />
              </>
            )}

            {currState === "Sign up" && isDataSubmitted && (
              <textarea onChange={(e) => setBio(e.target.value)} value={bio}
                rows={4} className='w-full p-3 pl-4 bg-black/20 text-white border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all placeholder-gray-400 resize-none' placeholder='Tell us a bit about yourself...' required></textarea>
            )
            }
          </div>

          <button type='submit' className='w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transform transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed text-lg tracking-wide'>
            {currState === "Sign up" ? "Create Account" : "Sign In"}
          </button>

          <div className='flex items-center gap-2 text-sm text-gray-300'>
            <input type="checkbox" id="terms" className="accent-purple-500 w-4 h-4" />
            <label htmlFor="terms" className="cursor-pointer select-none">Agree to terms & privacy policy</label>
          </div>

          <div className='flex flex-col gap-2 pt-2 border-t border-white/10'>
            {currState === "Sign up" ? (
              <p className='text-sm text-center text-gray-300'>Already have an account? <span onClick={() => { setCurrState("Login"); setIsDataSubmitted(false) }} className='font-semibold text-purple-300 hover:text-purple-200 cursor-pointer underline decoration-transparent hover:decoration-purple-300 transition-all'>Login here</span></p>
            ) : (
              <p className='text-sm text-center text-gray-300'>Don't have an account? <span onClick={() => setCurrState("Sign up")} className='font-semibold text-purple-300 hover:text-purple-200 cursor-pointer underline decoration-transparent hover:decoration-purple-300 transition-all'>Register here</span></p>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}

export default LoginPage
