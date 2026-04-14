// StarRating — reusable interactive + display-only 5-star component
// Usage (interactive):  <StarRating value={3} onChange={setRating} />
// Usage (read-only):    <StarRating value={4.2} readOnly size="sm" />

const StarRating = ({ value = 0, onChange, readOnly = false, size = 'md', showCount, count }) => {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const iconSize = sizes[size] || sizes.md;

  const stars = [1, 2, 3, 4, 5];

  if (readOnly) {
    const filled = Math.round(value);
    return (
      <span className="inline-flex items-center gap-1">
        {stars.map(s => (
          <svg
            key={s}
            className={`${iconSize} ${s <= filled ? 'text-amber-500' : 'text-paper-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {value > 0 && (
          <span className="font-mono text-[10px] font-bold text-ink-600 ml-0.5">
            {Number(value).toFixed(1)}
          </span>
        )}
        {showCount && count !== undefined && (
          <span className="text-[9px] font-black uppercase tracking-widest text-ink-400 ml-1">
            ({count})
          </span>
        )}
      </span>
    );
  }

  // Interactive
  return (
    <div className="flex items-center gap-1">
      {stars.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange && onChange(s)}
          className={`${iconSize} transition-transform hover:scale-125 focus:outline-none`}
          aria-label={`Rate ${s} stars`}
        >
          <svg
            className={`w-full h-full ${s <= value ? 'text-amber-500' : 'text-paper-300 hover:text-amber-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default StarRating;
