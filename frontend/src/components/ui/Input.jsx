import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  icon: Icon,
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5 pl-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary-500 transition-colors">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <input
          ref={ref}
          className={`input-field ${Icon ? 'pl-10' : ''} ${
            error 
              ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' 
              : 'hover:border-white/20'
          } ${className}`}
          {...props}
        />
        {/* Animated focus border glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-red-600 rounded-lg blur opacity-0 group-focus-within:opacity-20 transition duration-500 pointer-events-none"></div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500 pl-1 flex items-center gap-1 animate-fadeIn">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
