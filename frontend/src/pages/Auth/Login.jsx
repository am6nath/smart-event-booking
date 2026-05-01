import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

// Demo credentials for TCS evaluation (remove before production)
const DEMO = [
  { role: 'Admin', email: 'admin@tcs.com', password: 'admin123' },
  { role: 'Organizer', email: 'org@tcs.com', password: 'org123' },
  { role: 'User', email: 'user@tcs.com', password: 'user123' },
]

const Login = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname

  // ✨ Security/UX: Redirect if already logged in
  useEffect(() => {
    if (user) {
      const role = user.role
      if (role === 'admin') navigate('/dashboard/admin', { replace: true })
      else if (role === 'organizer') navigate('/dashboard/organizer', { replace: true })
      else navigate('/events', { replace: true })
    }
  }, [user, navigate])

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const fill = (cred) => {
    setForm({ email: cred.email, password: cred.password })
    toast.success(`${cred.role} credentials loaded`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await login(form)
      
      if (result.success) {
        const user = result.user
        if (from) {
          navigate(from, { replace: true })
        } else {
          const role = user?.role
          if (role === 'admin') navigate('/dashboard/admin', { replace: true })
          else if (role === 'organizer') navigate('/dashboard/organizer', { replace: true })
          else navigate('/events', { replace: true })
        }
      }
    } catch (err) {
      const msg = err.response?.status === 429 
        ? "Too many attempts. Please wait 15 minutes." 
        : err.response?.data?.message || 'Authentication failed.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-paper flex items-center justify-center p-6 md:p-12 font-sans text-ink-900 overflow-hidden"
    >
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(#1A1A12 1px, transparent 1px), linear-gradient(90deg, #1A1A12 1px, transparent 1px)`, 
             backgroundSize: '40px 40px' 
           }} 
      />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl flex flex-col md:flex-row bg-paper rounded-none shadow-paper border-2 border-forest-700/20 overflow-hidden"
      >
        
        {/* Left Side: Editorial Branding */}
        <div className="w-full md:w-5/12 bg-paper-200 p-10 md:p-16 border-b-2 md:border-b-0 md:border-r-2 border-paper-300 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[10px] font-black uppercase tracking-[0.4em] mb-20 text-ink-500"
            >
              EventHub / Portal
            </motion.div>
            <h2 className="text-5xl font-serif leading-[1.1] mb-6 italic text-ink-900 tracking-tight">
              The <br /> curated <br /> access.
            </h2>
            <p className="text-sm text-ink-500 leading-relaxed font-sans max-w-[220px]">
              A private collection of experiences designed for the refined demographic.
            </p>
          </div>
          
          <div className="mt-12 space-y-8 relative z-10">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-forest-700 font-black mb-4">Demo Presets</p>
              <div className="flex flex-wrap gap-2">
                {DEMO.map((d) => (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    key={d.role} 
                    onClick={() => fill(d)}
                    type="button"
                    className="text-[9px] border-2 border-forest-700/20 bg-paper px-4 py-2 hover:bg-forest-700 hover:text-paper hover:border-forest-700 transition-all uppercase tracking-[0.2em] font-black"
                  >
                    {d.role}
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="h-0.5 w-12 bg-forest-700" />
            <span className="text-[9px] uppercase tracking-[0.3em] text-ink-400 font-black block">Authentication Node v2.0</span>
          </div>
          
          {/* Subtle Watermark */}
          <div className="absolute -bottom-10 -left-10 text-[160px] font-serif italic font-bold text-forest-900/5 select-none pointer-events-none">
            eh
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="flex-1 p-10 md:p-20 bg-paper flex flex-col justify-center relative">
          <div className="max-w-sm mx-auto w-full">
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="space-y-10">
                {/* Email Input */}
                <div className="relative group">
                  <input 
                    type="email" 
                    required
                    value={form.email}
                    className="peer w-full bg-transparent border-b-2 border-paper-300 py-3 focus:border-forest-700 focus:outline-none transition-all placeholder-transparent text-ink-900 font-sans"
                    placeholder="Email"
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                  <label className="absolute left-0 -top-5 text-ink-400 text-[10px] uppercase tracking-[0.2em] transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-forest-700 font-black">
                    Email Identity
                  </label>
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <input 
                    type="password" 
                    required
                    value={form.password}
                    className="peer w-full bg-transparent border-b-2 border-paper-300 py-3 focus:border-forest-700 focus:outline-none transition-all placeholder-transparent text-ink-900 font-sans"
                    placeholder="Password"
                    onChange={(e) => setForm({...form, password: e.target.value})}
                  />
                  <label className="absolute left-0 -top-5 text-ink-400 text-[10px] uppercase tracking-[0.2em] transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-forest-700 font-black">
                    Secret Key
                  </label>
                </div>
              </div>

              <div className="pt-6 flex flex-col gap-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-forest w-full py-5 text-[11px] shadow-paper"
                >
                  {loading ? 'Verifying...' : 'Authorize Access'}
                </button>
                
                <div className="flex items-center justify-between transition-opacity">
                  <Link to="/events" className="text-[9px] uppercase tracking-widest text-ink-400 hover:text-forest-700 font-black">
                    Explore Anonymously
                  </Link>
                  <button type="button" className="text-[9px] uppercase tracking-widest text-ink-400 hover:text-forest-700 font-black">
                    Recovery
                  </button>
                </div>
              </div>
            </form>

            <footer className="mt-16 text-center border-t-2 border-dashed border-paper-300 pt-8">
              <p className="text-[11px] text-ink-500 font-sans tracking-wide">
                Not a member? 
                <Link to="/register" className="text-forest-700 font-black border-b-2 border-forest-700 ml-3 pb-0.5 transition-all hover:bg-forest-50 px-1">
                  Join the Registry
                </Link>
              </p>
            </footer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Login