import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import eventApi from '../services/eventApi'
import { formatDate, formatPrice } from '../utils/helpers'

const Home = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { 
    fetchEvents() 
  }, [])

  const fetchEvents = async () => {
    try {
      const { data } = await eventApi.getAll({ limit: 3, sortBy: 'date', order: 'asc' })
      setEvents(data.data || data || [])
    } catch (err) { 
      console.error("Discovery Error:", err) 
    } finally { 
      setLoading(false) 
    }
  }

  // Animation Variants
  const containerVars = {
    animate: { transition: { staggerChildren: 0.1 } }
  }
  
  const itemVars = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="page-wrapper selection:bg-forest-200 selection:text-forest-900"
    >
      
      {/* ── 🏆 HERO SECTION ── */}
      <section className="relative min-h-[90vh] flex items-center bg-forest-900 text-paper px-4 lg:px-8 overflow-hidden">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 lg:gap-20 items-center relative z-10 py-16">
          
          {/* Left: Typography */}
          <motion.div 
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="space-y-12"
          >
            <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-serif leading-[0.95] tracking-tight">
              Your moments <br />
              <span className="italic font-light text-paper-200">curated.</span>
            </h1>
            
            <p className="max-w-md text-xl text-paper-300 font-serif italic leading-relaxed">
              Find a high-caliber approach to discovering cultural moments and private gatherings.
            </p>

            {/* Search Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); navigate(`/events?search=${search}`) }} 
              className="max-w-sm group"
            >
              <div className="relative border-b-2 border-forest-700 focus-within:border-paper-200 transition-all duration-500 pb-1">
                <input 
                  type="text" 
                  placeholder="Search the archive..." 
                  className="w-full bg-transparent py-4 outline-none placeholder:text-forest-600 italic text-xl font-serif text-paper"
                  onChange={(e) => setSearch(e.target.value)}
                />
                <motion.button 
                  whileHover={{ x: 5 }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-paper uppercase text-[10px] tracking-[0.3em] font-black"
                >
                  Search →
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Right: Floating Card Image */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block relative"
          >
             <div className="aspect-[4/5] w-[85%] ml-auto bg-forest-950 relative shadow-2xl overflow-visible border-[12px] border-paper">
                <img 
                  src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070&auto=format&fit=crop" 
                  className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000 group-hover:scale-105"
                  alt="Atmospheric Event"
                />
                
                {/* Floating "Ticket" Style Note */}
                <motion.div 
                  initial={{ x: 20, y: 10, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute bottom-12 left-0 bg-paper p-8 w-[75%] shadow-paper text-ink-900 -translate-x-12 translate-y-12 border-2 border-forest-800 paper-corner"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-forest-700 mb-2 font-sans">Featured Entry</p>
                  <p className="font-serif italic text-3xl leading-tight text-ink-900">Midnight in the Garden</p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="h-px flex-1 bg-ink-300 dashed" />
                    <span className="text-[10px] font-mono text-ink-500">TKT-82X</span>
                  </div>
                </motion.div>
             </div>
          </motion.div>
        </div>
      </section>

      {/* ── 🛡️ LOGO STRIP ── */}
      <section className="py-20 bg-paper border-b-2 border-forest-700/20">
        <div className="container-paper flex flex-col md:flex-row items-center justify-between gap-12">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-ink-400 shrink-0">In Partnership With</p>
          <div className="flex flex-wrap justify-center items-center gap-16 opacity-40 hover:opacity-80 transition-opacity">
            <span className="font-serif italic text-2xl tracking-tighter text-ink-700">VOGUE</span>
            <span className="font-serif italic text-2xl tracking-tighter text-ink-700">The Monocle</span>
            <span className="font-serif italic text-2xl tracking-tighter text-ink-700">Condé Nast</span>
            <span className="font-serif italic text-2xl tracking-tighter text-ink-700">FORBES</span>
          </div>
        </div>
      </section>

      {/* ── 🖼️ THE ARCHIVE CATALOG ── */}
      <section className="py-32 container-paper">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 border-b-2 border-forest-700 pb-10 gap-8">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-forest-700 mb-4 underline underline-offset-8">Collection {new Date().getFullYear()}</p>
              <h2 className="text-5xl md:text-6xl font-serif italic text-ink-900">The Registry Archive</h2>
           </div>
           <Link to="/events" className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-ink-500 hover:text-forest-700 transition-all">
             Explore All <span className="group-hover:translate-x-1 transition-transform">→</span>
           </Link>
        </header>

        <motion.div 
          variants={containerVars}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
          className="grid md:grid-cols-3 gap-12 lg:gap-16"
        >
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="aspect-[3/4] bg-paper-200 animate-pulse border-2 border-paper-300" />)
          ) : (
            events.map(event => (
              <motion.div key={event._id} variants={itemVars} className="group cursor-pointer">
                <Link to={`/events/${event._id}`}>
                  <div className="aspect-[3/4] overflow-hidden mb-8 bg-paper-300 relative border-2 border-transparent group-hover:border-forest-700 transition-all duration-500 shadow-paper">
                    <img 
                      src={event.imageUrl || `https://picsum.photos/seed/${event._id}/800/1000`} 
                      className="w-full h-full object-cover mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-[1.5s] group-hover:scale-105"
                      alt={event.title}
                    />
                    <div className="absolute inset-0 bg-forest-900/10 group-hover:bg-transparent transition-colors" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-forest-700">
                      <span>{event.location}</span>
                      <span className="text-ink-400">{formatDate(event.date)}</span>
                    </div>
                    <h3 className="text-3xl font-serif italic text-ink-900 group-hover:text-forest-700 transition-colors">{event.title}</h3>
                    <div className="flex items-center justify-between pt-4 border-t-2 border-paper-300">
                      <span className="text-sm font-bold tracking-tighter text-ink-700">{formatPrice(event.price || event.ticketPrice)}</span>
                      <span className="text-[9px] uppercase tracking-widest font-black text-ink-900 border-b-2 border-forest-700 pb-1">Request</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>
      </section>

      {/* ── 📊 STATS SECTION ── */}
      <section className="py-32 bg-forest-900 text-paper relative overflow-hidden border-t-8 border-paper-bg border-double">
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
             
        <div className="max-w-4xl mx-auto px-8 text-center space-y-16 relative z-10">
          <h2 className="text-5xl md:text-6xl font-serif italic leading-tight tracking-tight text-paper">
            Beyond tickets. <br /> A lifestyle curated.
          </h2>
          <div className="grid md:grid-cols-3 gap-12 pt-8">
            {[
              { val: '500+', lab: 'Events Yearly' },
              { val: '24', lab: 'Urban Hubs' },
              { val: '100%', lab: 'Verified' }
            ].map((stat, i) => (
              <div key={i} className="space-y-4">
                <p className="text-6xl font-serif italic text-paper-200">{stat.val}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-forest-400">{stat.lab}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  )
}

export default Home