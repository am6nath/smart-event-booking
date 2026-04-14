import React from 'react';

const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading = false,
  ...props 
}, ref) => {
  const variants = {
    primary: "btn-forest",
    outline: "btn-outline-forest",
    ghost: "btn-ghost-forest",
    danger: "bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100 px-6 py-3 font-sans font-bold uppercase tracking-widest text-sm shadow-paper transition-all",
  };

  return (
    <button
      ref={ref}
      className={`${variants[variant] || variants.primary} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
