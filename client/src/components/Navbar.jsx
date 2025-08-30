// components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext'; // Add this import

const Navbar = ({ showShare, onShare }) => {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { isAuthenticated, user, logout, isLoading } = useAuth(); // Add auth context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <nav 
      className="sticky top-0 z-50 transition-all duration-300 border-b w-full"
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.border 
      }}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between h-[64px] px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div 
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="white"/>
              <path d="M8 12a4 4 0 0 1 8 0v4" stroke={colors.primary} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span 
            className="text-xl font-semibold tracking-tight"
            style={{ color: colors.text }}
          >
            StudyMate
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Mode Toggle */}
          <button 
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="w-11 h-7 flex items-center rounded-full px-2 transition-all duration-300"
            style={{ backgroundColor: colors.primary }}
          >
            <span 
              className={`inline-block h-5 w-5 bg-white rounded-full flex items-center justify-center shadow-md transform transition-transform duration-300 ${
                isDarkMode ? 'translate-x-4' : ''
              }`}
            >
              <svg height="16" width="16" viewBox="0 0 24 24" fill="none">
                {isDarkMode ? (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={colors.primary} />
                ) : (
                  <circle cx="12" cy="12" r="5" fill={colors.primary} />
                )}
              </svg>
            </span>
          </button>

          {/* Share button: visible only if showShare */}
          {showShare && (
            <button
              onClick={onShare}
              className="flex items-center px-5 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg hover:shadow-blue-500/30 hover:from-blue-600 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <svg
                className="mr-2"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.59 13.51L15.42 17.49" />
                <path d="M15.41 6.51L8.59 10.49" />
              </svg>
              Share
            </button>
          )}

          {/* Conditional Authentication Buttons */}
          {!isLoading && (
            <>
              {!isAuthenticated ? (
                // Show Login/Signup when not authenticated
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    style={{
                      color: colors.textSecondary,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = colors.text;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = colors.textSecondary;
                    }}
                  >
                    Sign Up
                  </button>
                  
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 border"
                    style={{
                      color: colors.text,
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = colors.surface;
                    }}
                  >
                    Login
                  </button>
                </div>
              ) : (
                // Show User info and Logout when authenticated
                <div className="flex items-center space-x-3">
                  {/* User Avatar/Info */}
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ 
                        backgroundColor: colors.primary,
                        color: 'white'
                      }}
                    >
                      {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span 
                      className="text-sm font-medium hidden sm:block"
                      style={{ color: colors.text }}
                    >
                      {user?.firstName || 'User'}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 border"
                    style={{
                      color: colors.error || '#EF4444',
                      backgroundColor: colors.surface,
                      borderColor: colors.error || '#EF4444',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${colors.error || '#EF4444'}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = colors.surface;
                    }}
                  >
                    <svg 
                      className="w-4 h-4 mr-1 inline"
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div 
              className="w-8 h-8 rounded-full animate-pulse"
              style={{ backgroundColor: colors.surfaceHover }}
            />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
