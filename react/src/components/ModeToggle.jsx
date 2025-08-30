import React from 'react';

const ModeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        darkMode 
          ? 'bg-blue-600 focus:ring-blue-500' 
          : 'bg-gray-300 focus:ring-gray-400'
      } focus:ring-offset-gray-900`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 transform ${
          darkMode 
            ? 'translate-x-6 bg-white' 
            : 'translate-x-0.5 bg-white'
        } shadow-md flex items-center justify-center`}
      >
        <i className={`text-xs transition-all duration-300 ${
          darkMode 
            ? 'fas fa-moon text-gray-700' 
            : 'fas fa-sun text-yellow-500'
        }`}></i>
      </div>
    </button>
  );
};

export default ModeToggle;
