import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const PreviousStudies = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const studies = [
    {
      id: 1,
      title: 'Climate Change Research',
      lastModified: '2 days ago',
      sources: 5,
      description: 'Comprehensive analysis of climate change impacts and solutions',
    },
    {
      id: 2,
      title: 'Machine Learning Fundamentals',
      lastModified: '1 week ago',
      sources: 8,
      description: 'Deep dive into ML algorithms and their applications',
    },
    {
      id: 3,
      title: 'Quantum Computing Overview',
      lastModified: '2 weeks ago',
      sources: 3,
      description: 'Exploring quantum computing principles and future potential',
    },
  ];

  return (
    <div 
      className="py-16 transition-colors duration-300"
      style={{ backgroundColor: colors.surface }}
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 
            className="text-3xl font-bold mb-4"
            style={{ color: colors.text }}
          >
            Recent Studies
          </h2>
          <p 
            className="text-lg"
            style={{ color: colors.textSecondary }}
          >
            Continue where you left off or start a new research project
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {studies.map((study) => (
            <div
              key={study.id}
              className="p-6 rounded-xl shadow-lg cursor-pointer transition-all duration-200 border"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                boxShadow: `0 4px 12px ${colors.primary}10`
              }}
              onClick={() => navigate('/upload')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${colors.primary}20`;
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}10`;
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <i 
                    className="fas fa-book text-xl"
                    style={{ color: colors.primary }}
                  ></i>
                </div>
                <div 
                  className="flex items-center space-x-1 text-sm px-2 py-1 rounded"
                  style={{ 
                    backgroundColor: colors.surfaceHover,
                    color: colors.textMuted 
                  }}
                >
                  <i className="fas fa-file text-xs"></i>
                  <span>{study.sources}</span>
                </div>
              </div>
              
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: colors.text }}
              >
                {study.title}
              </h3>
              
              <p 
                className="text-sm mb-4 line-clamp-2"
                style={{ color: colors.textSecondary }}
              >
                {study.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span 
                  className="text-xs"
                  style={{ color: colors.textMuted }}
                >
                  Modified {study.lastModified}
                </span>
                <button
                  className="text-sm font-medium px-3 py-1 rounded transition-colors duration-200"
                  style={{ 
                    color: colors.primary,
                    backgroundColor: `${colors.primary}10`
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = `${colors.primary}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = `${colors.primary}10`;
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create New Study Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 border-2 border-dashed"
            style={{
              borderColor: colors.primary,
              color: colors.primary,
              backgroundColor: `${colors.primary}05`
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `${colors.primary}15`;
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = `${colors.primary}05`;
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <i className="fas fa-plus mr-3"></i>
            Start New Study
          </button>
        </div>

        {/* Template Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 
              className="text-2xl font-bold mb-2"
              style={{ color: colors.text }}
            >
              Study Templates
            </h3>
            <p 
              className="text-lg"
              style={{ color: colors.textSecondary }}
            >
              Perfect starter templates for different types of research
            </p>
          </div>

          <div 
            className="p-8 rounded-xl border text-center"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border
            }}
          >
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <i 
                className="fas fa-robot text-2xl"
                style={{ color: colors.primary }}
              ></i>
            </div>
            <h4 
              className="text-xl font-semibold mb-2"
              style={{ color: colors.text }}
            >
              AI Research Template
            </h4>
            <p 
              className="mb-6"
              style={{ color: colors.textSecondary }}
            >
              Perfect starter template for AI and machine learning research
            </p>
            <button
              className="px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              style={{
                backgroundColor: colors.primary,
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviousStudies;
