import React from 'react';

const Loader = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Outer glowing ring */}
        <div className="w-12 h-12 rounded-full border-4 border-dark-700"></div>
        {/* Spinning inner ring */}
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-t-transparent border-r-primary-400/50 border-b-transparent border-l-transparent animate-ping"></div>
      </div>
      <p className="text-gray-400 font-medium tracking-wide animate-pulse">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center p-8">
      {content}
    </div>
  );
};

export default Loader;
