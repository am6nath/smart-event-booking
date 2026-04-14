import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'

const Register = () => {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  // ✨ Security/UX: Redirect if already logged in
  useEffect(() => {
    if (user) {
      const role = user.role
      if (role === 'admin') navigate('/dashboard/admin', { replace: true })
      else if (role === 'organizer') navigate('/dashboard/organizer', { replace: true })
      else navigate('/events', { replace: true })
    }
  }, [user, navigate])
  
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('user')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validateForm = () => {
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return false
    }
    setError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error(error, { className: 'bg-red-50 border-2 border-red-200 !shadow-paper text-red-900 font-sans font-bold text-xs' })
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const result = await register({ 
        name: form.name, 
        email: form.email, 
        password: form.password, 
        role 
      })
      
      if (result.success) {
        if (role === 'organizer') {
          navigate('/dashboard/organizer', { replace: true })
        } else {
          navigate('/events', { replace: true })
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(msg, { className: 'bg-red-50 border-2 border-red-200 !shadow-paper text-red-900 font-sans font-bold text-xs' })
    } finally {
      setLoading(false)
    }
  }

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="min-h-screen bg-paper flex items-center justify-center p-6 md:p-12 font-sans text-ink-900"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ 
             backgroundImage: `linear-gradient(#1A1A12 1px, transparent 1px), linear-gradient(90deg, #1A1A12 1px, transparent 1px)`, 
             backgroundSize: '40px 40px' 
           }} 
      />

      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl flex flex-col md:flex-row bg-paper rounded-none shadow-paper border-2 border-forest-700/20 overflow-hidden"
      >
        
        {/* Left Side: Editorial Branding */}
        <div className="w-full md:w-5/12 bg-paper-200 p-10 md:p-16 border-b-2 md:border-b-0 md:border-r-2 border-paper-300 flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-20 text-ink-500">EventHub / Join</div>
            <AnimatePresence mode="wait">
              <motion.h2 
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-5xl font-serif leading-[1.1] mb-6 italic text-ink-900 tracking-tight"
              >
                {step === 1 ? "Define your \n presence." : "Establish your \n identity."}
              </motion.h2>
            </AnimatePresence>
            <p className="text-sm text-ink-500 leading-relaxed font-sans max-w-[240px]">
              Whether searching for the avant-garde or hosting the exceptional, your place in the registry awaits.
            </p>
          </div>
          
          <div className="mt-12 relative z-10">
            <div className="flex gap-2 mb-6">
              <div className={`h-1 w-10 transition-all duration-500 ${step === 1 ? 'bg-forest-700' : 'bg-paper-300'}`} />
              <div className={`h-1 w-10 transition-all duration-500 ${step === 2 ? 'bg-forest-700' : 'bg-paper-300'}`} />
            </div>
            <span className="text-[9px] uppercase tracking-[0.3em] text-ink-400 font-black block">Registry Protocol 2.4</span>
          </div>

          <div className="absolute -bottom-10 -left-10 text-[160px] font-serif italic font-bold text-forest-900/5 select-none pointer-events-none">
            eh
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="flex-1 p-10 md:p-20 bg-paper min-h-[500px] flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div 
                  key="step1"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-10"
                >
                  <div className="space-y-4">
                    {['user', 'organizer'].map((type) => (
                      <motion.button
                        whileHover={{ x: 4 }}
                        key={type}
                        onClick={() => setRole(type)}
                        className={`group w-full flex items-center justify-between p-8 border-2 transition-all duration-300 ${
                          role === type ? 'border-forest-700 bg-forest-50 shadow-sm' : 'border-paper-300 hover:border-forest-700/50 bg-paper'
                        }`}
                      >
                        <div className="text-left">
                          <p className={`text-[9px] uppercase tracking-[0.2em] mb-2 font-black ${role === type ? 'text-forest-700' : 'text-ink-400'}`}>
                            {type === 'user' ? 'Member Identity' : 'Curator Identity'}
                          </p>
                          <p className="font-serif text-xl italic text-ink-900">
                            {type === 'user' ? 'Attendee' : 'Organizer'}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-none border border-forest-700 transition-all duration-300 ${role === type ? 'bg-forest-700 scale-[2]' : 'bg-transparent'}`} />
                      </motion.button>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="btn-forest w-full py-5 text-[11px] shadow-paper"
                  >
                    Continue to Detail
                  </button>
                </motion.div>
              ) : (
                <motion.form 
                  key="step2"
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleSubmit} 
                  className="space-y-10"
                >
                  <div className="space-y-10">
                    <div className="relative group">
                      <input 
                        type="text" 
                        required
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        className="peer w-full bg-transparent border-b-2 border-paper-300 py-3 focus:border-forest-700 focus:outline-none transition-all placeholder-transparent text-ink-900 font-sans"
                        placeholder="Name"
                      />
                      <label className="absolute left-0 -top-5 text-ink-400 text-[10px] uppercase tracking-[0.2em] transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-forest-700 font-black">
                        Full Designation
                      </label>
                    </div>

                    <div className="relative group">
                      <input 
                        type="email" 
                        required
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        className="peer w-full bg-transparent border-b-2 border-paper-300 py-3 focus:border-forest-700 focus:outline-none transition-all placeholder-transparent text-ink-900 font-sans"
                        placeholder="Email"
                      />
                      <label className="absolute left-0 -top-5 text-ink-400 text-[10px] uppercase tracking-[0.2em] transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-forest-700 font-black">
                        Email Identity
                      </label>
                    </div>

                    <div className="relative group">
                      <input 
                        type="password" 
                        required
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        className="peer w-full bg-transparent border-b-2 border-paper-300 py-3 focus:border-forest-700 focus:outline-none transition-all placeholder-transparent text-ink-900 font-sans"
                        placeholder="Password"
                      />
                      <label className="absolute left-0 -top-5 text-ink-400 text-[10px] uppercase tracking-[0.2em] transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-forest-700 font-black">
                        Secret Key
                      </label>
                    </div>

                    <div className="relative group">
                      <input 
                        type="password" 
                        required
                        value={form.confirm}
                        onChange={(e) => setForm({...form, confirm: e.target.value})}
                        className="peer w-full bg-transparent border-b-2 border-paper-300 py-3 focus:border-forest-700 focus:outline-none transition-all placeholder-transparent text-ink-900 font-sans"
                        placeholder="Confirm Password"
                      />
                      <label className="absolute left-0 -top-5 text-ink-400 text-[10px] uppercase tracking-[0.2em] transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-forest-700 font-black">
                        Confirm Secret Key
                      </label>
                    </div>

                    {error && (
                      <p className="text-red-700 bg-red-50 border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest mt-2">{error}</p>
                    )}
                  </div>

                  <div className="pt-6 flex flex-col gap-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-forest w-full py-5 text-[11px] shadow-paper"
                    >
                      {loading ? 'Processing Registration...' : 'Create Ledger Entry'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="text-[9px] uppercase tracking-[0.3em] text-ink-400 hover:text-forest-700 transition-colors font-black text-center"
                    >
                      ← Back to Roles
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <footer className="mt-16 text-center border-t-2 border-dashed border-paper-300 pt-8">
              <p className="text-[11px] text-ink-500 font-sans tracking-wide">
                Already registered? 
                <Link to="/login" className="text-forest-700 font-black border-b-2 border-forest-700 ml-3 pb-0.5 transition-all hover:bg-forest-50 px-1">
                  Access Portal
                </Link>
              </p>
            </footer>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Register