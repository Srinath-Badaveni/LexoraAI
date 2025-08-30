import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import UploadModal from '../components/UploadModal';

const LandingPage = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Enhanced color scheme for better dark mode
  const enhancedColors = {
    ...colors,
    // Better gradients and backgrounds for dark mode
    heroGradient: isDarkMode
      ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f172a 100%)'
      : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',

    cardBackground: isDarkMode ? '#1e293b' : colors.surface,
    cardHover: isDarkMode ? '#334155' : colors.surfaceHover || colors.primary + '08',

    // Better accent colors
    accent: isDarkMode ? '#3b82f6' : colors.primary,
    accentHover: isDarkMode ? '#2563eb' : colors.primary + 'dd',

    // Enhanced borders
    borderLight: isDarkMode ? '#374151' : colors.border,
    borderHover: isDarkMode ? '#4f46e5' : colors.primary + '40',

    // Text enhancements
    textPrimary: isDarkMode ? '#f1f5f9' : colors.text,
    textSecondary: isDarkMode ? '#94a3b8' : colors.textSecondary,
    textAccent: isDarkMode ? '#60a5fa' : colors.primary,
  };

  // Fetch notebooks from API
  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8001/hackrx/notebooks');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setNotebooks(data.notebooks || []);
      } catch (err) {
        console.error('Error fetching notebooks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotebooks();
  }, []);

  const handleGetStarted = () => openModal();
  const handleNewStudy = () => openModal();

  const scrollToLearnMore = () => {
    const studiesSection = document.getElementById('previous-studies');
    if (studiesSection) {
      studiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddSource = (sourceData) => {
    closeModal();
    navigate('/upload');
  };

  const handleNotebookClick = (notebookId) => {
    navigate(`/notebook/${notebookId}`);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const PreviousStudies = () => (
    <div
      className="py-20 relative overflow-hidden"
      style={{
        background: isDarkMode
          ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl"
          style={{ backgroundColor: enhancedColors.accent }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: enhancedColors.accent }}
        ></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2
            className="text-5xl font-bold mb-6 bg-clip-text text-transparent"
            style={{
              backgroundImage: isDarkMode
                ? 'linear-gradient(135deg, #f1f5f9 0%, #60a5fa 100%)'
                : 'linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)'
            }}
          >
            Your Research Journey
          </h2>
          <p
            className="text-xl max-w-3xl mx-auto leading-relaxed"
            style={{ color: enhancedColors.textSecondary }}
          >
            {notebooks.length > 0
              ? `Continue working on your ${notebooks.length} research notebook${notebooks.length === 1 ? '' : 's'} or start a new study.`
              : 'Start your first research project and build your knowledge base.'
            }
          </p>
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="relative">
              <div
                className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
                style={{ borderColor: enhancedColors.accent, borderTopColor: 'transparent' }}
              />
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: enhancedColors.accent + '20' }}
              />
            </div>
            <p className="mt-6 text-lg font-medium" style={{ color: enhancedColors.textSecondary }}>
              Loading your studies...
            </p>
          </div>
        )}

        {error && (
          <div
            className="text-center py-16 px-8 rounded-2xl mx-auto max-w-md backdrop-blur-sm border"
            style={{
              backgroundColor: isDarkMode ? '#ef4444' + '15' : '#fef2f2',
              borderColor: isDarkMode ? '#ef4444' + '30' : '#fecaca',
              color: isDarkMode ? '#fca5a5' : '#dc2626'
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: isDarkMode ? '#ef4444' + '20' : '#fee2e2' }}
            >
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <p className="font-semibold text-lg mb-2">Failed to load studies</p>
            <p className="text-sm opacity-75">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {notebooks.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${enhancedColors.accent}20 0%, ${enhancedColors.accent}10 100%)`,
                    border: `2px solid ${enhancedColors.accent}30`
                  }}
                >
                  <i
                    className="fas fa-book-open text-4xl"
                    style={{ color: enhancedColors.accent }}
                  />
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{ backgroundColor: enhancedColors.accent + '10' }}
                  />
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: enhancedColors.textPrimary }}>
                  No Studies Yet
                </h3>
                <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: enhancedColors.textSecondary }}>
                  Upload your first document to begin your research journey
                </p>
                <button
                  onClick={handleNewStudy}
                  className="px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 relative overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${enhancedColors.accent} 0%, ${enhancedColors.accentHover} 100%)`,
                    color: 'white',
                    boxShadow: `0 8px 32px ${enhancedColors.accent}40`
                  }}
                >
                  <span className="relative z-10 flex items-center">
                    <i className="fas fa-plus mr-3"></i>
                    Create First Study
                  </span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                </button>
              </div>
            ) : (
              <>
                {notebooks.map((notebook) => (
                  <div
                    key={notebook.notebook_id}
                    className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                    onClick={() => handleNotebookClick(notebook.notebook_id)}
                  >
                    <div
                      className="p-8 rounded-2xl shadow-lg border backdrop-blur-sm relative overflow-hidden"
                      style={{
                        backgroundColor: enhancedColors.cardBackground,
                        borderColor: enhancedColors.borderLight,
                        boxShadow: isDarkMode
                          ? '0 10px 40px rgba(0, 0, 0, 0.3)'
                          : '0 10px 40px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {/* Hover effect overlay */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                        style={{
                          background: `linear-gradient(135deg, ${enhancedColors.accent}08 0%, ${enhancedColors.accent}15 100%)`,
                          backdropFilter: 'blur(10px)'
                        }}
                      />

                      {/* Content */}
                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center flex-1 min-w-0">
                            <div
                              className="w-14 h-14 rounded-xl flex items-center justify-center mr-4 relative overflow-hidden"
                              style={{
                                background: `linear-gradient(135deg, ${enhancedColors.accent}20 0%, ${enhancedColors.accent}30 100%)`,
                                border: `1px solid ${enhancedColors.accent}40`
                              }}
                            >
                              <i
                                className="fas fa-file-pdf text-xl"
                                style={{ color: enhancedColors.accent }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3
                                className="font-bold text-xl leading-tight group-hover:text-opacity-90 transition-all duration-300"
                                style={{ color: enhancedColors.textPrimary }}
                                title={notebook.title}
                              >
                                {notebook.title}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* File info */}
                        <div className="mb-6">
                          <div
                            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border"
                            style={{
                              backgroundColor: enhancedColors.accent + '15',
                              color: enhancedColors.accent,
                              borderColor: enhancedColors.accent + '30'
                            }}
                          >
                            <i className="fas fa-file mr-2"></i>
                            {notebook.pdf_filename}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between text-sm mb-8">
                          <div
                            className="flex items-center px-3 py-2 rounded-lg"
                            style={{
                              backgroundColor: isDarkMode ? '#374151' : '#f1f5f9',
                              color: enhancedColors.textSecondary
                            }}
                          >
                            <i className="fas fa-question-circle mr-2"></i>
                            <span className="font-medium">
                              {notebook.questions_count} question{notebook.questions_count === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div
                            className="flex items-center text-xs"
                            style={{ color: enhancedColors.textSecondary }}
                          >
                            <i className="fas fa-clock mr-2"></i>
                            <span>{formatDate(notebook.created_at)}</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group"
                            style={{
                              background: `linear-gradient(135deg, ${enhancedColors.accent}20 0%, ${enhancedColors.accent}30 100%)`,
                              color: enhancedColors.accent,
                              border: `1px solid ${enhancedColors.accent}40`
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotebookClick(notebook.notebook_id);
                            }}
                          >
                            <span className="relative z-10 flex items-center justify-center">
                              <i className="fas fa-external-link-alt mr-2"></i>
                              Open Study
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                          </button>

                          <button
                            className="p-3 rounded-xl text-sm font-medium transition-all duration-300 border"
                            style={{
                              backgroundColor: enhancedColors.cardBackground,
                              color: enhancedColors.textSecondary,
                              borderColor: enhancedColors.borderLight
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add more actions here
                            }}
                          >
                            <i className="fas fa-ellipsis-h"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new study card */}
                <div
                  className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                  onClick={handleNewStudy}
                >
                  <div
                    className="p-8 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[320px] backdrop-blur-sm relative overflow-hidden"
                    style={{
                      borderColor: enhancedColors.borderLight,
                      backgroundColor: enhancedColors.cardBackground + '50'
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                      style={{
                        background: `linear-gradient(135deg, ${enhancedColors.accent}05 0%, ${enhancedColors.accent}15 100%)`
                      }}
                    />

                    <div className="relative z-10 text-center">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${enhancedColors.accent}20 0%, ${enhancedColors.accent}30 100%)`,
                          border: `2px solid ${enhancedColors.accent}40`
                        }}
                      >
                        <i
                          className="fas fa-plus text-2xl transition-transform duration-300 group-hover:scale-110"
                          style={{ color: enhancedColors.accent }}
                        />
                      </div>
                      <h3
                        className="font-bold text-xl mb-3"
                        style={{ color: enhancedColors.textPrimary }}
                      >
                        New Study
                      </h3>
                      <p
                        className="text-center leading-relaxed max-w-xs"
                        style={{ color: enhancedColors.textSecondary }}
                      >
                        Upload documents to start a new research project
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen transition-colors duration-300 relative overflow-hidden"
      style={{
        background: enhancedColors.heroGradient,
        color: enhancedColors.textPrimary
      }}
    >
      {/* Background elements */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: enhancedColors.accent + '15' }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: enhancedColors.accent + '10', animationDelay: '2s' }}
        />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <h1
            className="text-6xl font-bold mb-8 leading-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: isDarkMode
                ? 'linear-gradient(135deg, #f1f5f9 0%, #60a5fa 50%, #3b82f6 100%)'
                : 'linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #1d4ed8 100%)'
            }}
          >
            Transform your research with{' '}
            <span className="block mt-2">AI-powered insights</span>
          </h1>
          <p
            className="text-2xl mb-12 leading-relaxed font-light max-w-4xl mx-auto"
            style={{ color: enhancedColors.textSecondary }}
          >
            Upload your sources, get comprehensive analyses, and accelerate your learning journey.
          </p>

          {/* Enhanced buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <button
              onClick={handleGetStarted}
              className="px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 relative overflow-hidden group"
              style={{
                background: `linear-gradient(135deg, ${enhancedColors.accent} 0%, ${enhancedColors.accentHover} 100%)`,
                color: 'white',
                boxShadow: `0 12px 40px ${enhancedColors.accent}50`
              }}
            >
              <span className="relative z-10 flex items-center">
                <i className="fas fa-rocket mr-3"></i>
                Get Started
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>

            <button
              onClick={scrollToLearnMore}
              className="px-10 py-5 rounded-2xl font-semibold text-xl border-2 transition-all duration-300 hover:shadow-xl backdrop-blur-sm relative overflow-hidden group"
              style={{
                borderColor: enhancedColors.borderHover,
                color: enhancedColors.textPrimary,
                backgroundColor: enhancedColors.cardBackground + '80'
              }}
            >
              <span className="relative z-10 flex items-center">
                <i className="fas fa-info-circle mr-3"></i>
                Learn More
              </span>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: enhancedColors.accent + '10' }}
              />
            </button>
          </div>

          {/* Feature Highlights with enhanced styling */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: 'fas fa-upload',
                title: 'Upload Documents',
                description: 'Drag & drop PDFs, documents, or paste text to get started with your research.'
              },
              {
                icon: 'fas fa-brain',
                title: 'AI Analysis',
                description: 'Get intelligent insights and answers to your questions from your uploaded content.'
              },
              {
                icon: 'fas fa-volume-up',
                title: 'Audio Summaries',
                description: 'Listen to AI-generated audio overviews of your research materials on the go.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl cursor-pointer backdrop-blur-sm border group transform hover:scale-105"
                style={{
                  backgroundColor: enhancedColors.cardBackground + '80',
                  borderColor: enhancedColors.borderLight
                }}
                onClick={handleNewStudy}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${enhancedColors.accent}20 0%, ${enhancedColors.accent}30 100%)`,
                    border: `2px solid ${enhancedColors.accent}40`
                  }}
                >
                  <i
                    className={`${feature.icon} text-3xl transition-transform duration-300 group-hover:scale-110`}
                    style={{ color: enhancedColors.accent }}
                  />
                </div>
                <h3
                  className="text-2xl font-bold mb-4"
                  style={{ color: enhancedColors.textPrimary }}
                >
                  {feature.title}
                </h3>
                <p
                  className="leading-relaxed"
                  style={{ color: enhancedColors.textSecondary }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Previous Studies Section */}
      <div id="previous-studies">
        <PreviousStudies />
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onAddSource={handleAddSource}
      />
    </div>
  );
};

export default LandingPage;
