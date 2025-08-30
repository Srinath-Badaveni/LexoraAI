import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const NotFound = () => {
  const { colors } = useTheme();
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center transition-colors duration-300"
      style={{ 
        backgroundColor: colors.background,
        color: colors.text 
      }}
    >
      <div className="text-center max-w-md mx-auto px-6">
        {/* 404 Icon */}
        <div 
          className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={colors.primary} 
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10"/>
            <path d="m15 9-6 6"/>
            <path d="m9 9 6 6"/>
          </svg>
        </div>

        <h1 
          className="text-6xl font-bold mb-4"
          style={{ color: colors.primary }}
        >
          404
        </h1>
        
        <h2 
          className="text-3xl font-semibold mb-4"
          style={{ color: colors.text }}
        >
          Page Not Found
        </h2>
        
        <p 
          className="text-lg mb-8 leading-relaxed"
          style={{ color: colors.textSecondary }}
        >
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
            style={{
              backgroundColor: colors.primary,
              color: 'white',
              boxShadow: `0 4px 12px ${colors.primary}30`
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = `0 8px 16px ${colors.primary}40`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 12px ${colors.primary}30`;
            }}
          >
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-lg font-medium border transition-all duration-200"
            style={{
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.surface
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.surfaceHover;
              e.target.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.surface;
              e.target.style.borderColor = colors.border;
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
