import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6 font-sans text-ink-900 overflow-hidden">
      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `linear-gradient(#1A1A12 1px, transparent 1px), linear-gradient(90deg, #1A1A12 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
      />

      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-xl w-full text-center py-20 px-8"
      >
        <div className="relative mb-12">
           <h1 className="text-[180px] font-serif italic font-bold text-forest-900/10 leading-none select-none">404</h1>
           <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="text-4xl md:text-5xl font-serif italic font-bold text-ink-900 tracking-tight">
                Lost in the <br /> <span className="text-forest-700">archive.</span>
              </h2>
           </div>
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ink-400 mb-8">Registry Note: Void Record</p>
        
        <p className="max-w-xs mx-auto text-sm text-ink-500 leading-relaxed font-serif italic mb-12">
          The node you seek does not exist in our current registry. It may have been redacted, moved to a private collection, or never existed at all.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link 
            to="/" 
            className="btn-forest px-10 py-4 text-[11px] shadow-paper w-full sm:w-auto"
          >
            Return to Hub
          </Link>
          <Link 
            to="/events" 
            className="text-[10px] font-black uppercase tracking-[0.3em] text-ink-500 hover:text-forest-700 transition-colors border-b-2 border-transparent hover:border-forest-700 pb-1"
          >
            Browse Registry
          </Link>
        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-forest-700/20" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-forest-700/20" />
      </motion.div>
    </div>
  );
};

export default NotFound;