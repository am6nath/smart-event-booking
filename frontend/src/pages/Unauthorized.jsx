import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Unauthorized = () => (
  <div className="min-h-screen bg-paper flex items-center justify-center p-6 font-sans text-ink-900">
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
         style={{ backgroundImage: `linear-gradient(#1A1A12 1px, transparent 1px), linear-gradient(90deg, #1A1A12 1px, transparent 1px)`, backgroundSize: '40px 40px' }} 
    />

    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative max-w-md w-full text-center paper-card border-2 border-forest-700/30 p-12 shadow-paper"
    >
      <div className="text-forest-700 mb-8 flex justify-center">
        <div className="w-20 h-20 border-2 border-forest-700 rounded-full flex items-center justify-center -rotate-12 bg-forest-50">
           <span className="text-3xl">🚫</span>
        </div>
      </div>
      
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-forest-700 mb-4 underline decoration-2 underline-offset-8">Access Denied</p>
      
      <h1 className="text-5xl font-serif italic font-bold text-ink-900 mb-6">Unauthorised.</h1>
      
      <p className="text-sm text-ink-500 leading-relaxed font-serif italic mb-10">
        This registry entry is reserved for curators of a different standing. Your current credentials do not suffice for this node.
      </p>

      <div className="flex flex-col gap-4">
        <Link to="/" className="btn-forest w-full py-4 text-[11px]">
          Return to Hub
        </Link>
        <Link to="/login" className="text-[9px] font-black uppercase tracking-widest text-ink-400 hover:text-forest-700 transition-colors">
          Authenticate as Different Identity
        </Link>
      </div>

      {/* Decorative Stamp */}
      <div className="absolute -bottom-6 -right-6 text-[80px] font-serif italic font-bold text-forest-900/5 select-none pointer-events-none">
        403
      </div>
    </motion.div>
  </div>
);

export default Unauthorized;
