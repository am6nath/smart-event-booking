export default function Footer() {
  return (
    <footer className="bg-paper border-t-2 border-forest-700/30 pt-16 pb-12 px-8 text-ink-900 font-sans"
            style={{ boxShadow: '0 -2px 0 rgba(45,90,39,0.08)' }}>
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
        
        {/* Subtle Decorative Element */}
        <div className="flex items-center gap-4 w-full max-w-[200px]">
          <div className="h-0.5 flex-1 bg-paper-300" />
          <div className="w-2 h-2 rotate-45 border-2 border-forest-600 bg-paper" />
          <div className="h-0.5 flex-1 bg-paper-300" />
        </div>

        <div className="text-center space-y-4">
          <div className="text-xl font-serif italic font-bold tracking-tight text-ink-900 group">
            EventHub<span className="text-forest-600 not-italic">.</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <p className="text-[9px] uppercase tracking-[0.4em] font-black text-ink-500">
              © {new Date().getFullYear()} All Rights Reserved
            </p>
            
            <div className="flex items-center justify-center gap-4 text-[9px] uppercase tracking-[0.3em] font-bold text-forest-700">
              <span>Collection</span>
              <span className="w-1 h-1 bg-forest-400 rounded-full" />
              <span>Curation</span>
              <span className="w-1 h-1 bg-forest-400 rounded-full" />
              <span>Experience</span>
            </div>
          </div>
        </div>

        {/* Project Credit - Made sophisticated */}
        <div className="mt-8 pt-8 border-t-2 border-paper-300 border-dashed w-full max-w-xs text-center">
          <p className="text-[9px] uppercase tracking-[0.3em] text-ink-300 font-bold leading-loose">
            Project Submission <br /> 
            <span className="text-forest-700 font-black tracking-[0.4em]">TCS iON Digital Learning</span>
          </p>
        </div>
      </div>
    </footer>
  );
}