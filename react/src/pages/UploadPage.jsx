import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import UploadModal from '../components/UploadModal';

const UploadPage = () => {
    const { colors, isDarkMode } = useTheme();
    const { notebookId } = useParams();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sources, setSources] = useState([]);
    const [notebookData, setNotebookData] = useState(null);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [notebookLoading, setNotebookLoading] = useState(true);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Audio states
    const [audioUrl, setAudioUrl] = useState('');
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // Speech states
    const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
    const [speechUtterance, setSpeechUtterance] = useState(null);

    // Refs
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    const API_BASE_URL = 'http://localhost:8001/hackrx';

    // Enhanced color scheme (same as before)
    const enhancedColors = {
        ...colors,
        mainBackground: isDarkMode ? '#0f172a' : '#ffffff',
        sidebarBackground: isDarkMode ? '#1e293b' : '#f8fafc',
        chatBackground: isDarkMode ? '#0f172a' : '#ffffff',
        cardBackground: isDarkMode ? '#334155' : '#ffffff',
        cardHover: isDarkMode ? '#475569' : '#f1f5f9',
        messageBackground: isDarkMode ? '#1e293b' : '#f8fafc',
        primary: isDarkMode ? '#3b82f6' : '#2563eb',
        primaryHover: isDarkMode ? '#2563eb' : '#1d4ed8',
        secondary: isDarkMode ? '#8b5cf6' : '#7c3aed',
        textPrimary: isDarkMode ? '#f1f5f9' : '#1e293b',
        textSecondary: isDarkMode ? '#94a3b8' : '#64748b',
        textMuted: isDarkMode ? '#64748b' : '#94a3b8',
        border: isDarkMode ? '#374151' : '#e2e8f0',
        borderHover: isDarkMode ? '#4f46e5' : '#3b82f6',
        success: isDarkMode ? '#10b981' : '#059669',
        warning: isDarkMode ? '#f59e0b' : '#d97706',
        error: isDarkMode ? '#ef4444' : '#dc2626',
        glow: isDarkMode ? '0 0 20px rgba(59, 130, 246, 0.3)' : '0 0 20px rgba(37, 99, 235, 0.2)',
        shadow: isDarkMode ? '0 10px 40px rgba(0, 0, 0, 0.3)' : '0 10px 40px rgba(0, 0, 0, 0.1)',
    };

    // Speech Button Component
    const SpeechButton = ({ text, messageIndex }) => {
        const isSpeaking = speakingMessageIndex === messageIndex;

        const handleSpeak = () => {
            // Stop any current speech
            if (speechUtterance) {
                window.speechSynthesis.cancel();
                setSpeechUtterance(null);
                setSpeakingMessageIndex(null);
            }

            // If we were speaking this message, just stop
            if (isSpeaking) {
                return;
            }

            // Start speaking this message
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);

                // Configure speech settings
                utterance.rate = 0.9;
                utterance.pitch = 1;
                utterance.volume = 1;

                // Event handlers
                utterance.onstart = () => {
                    setSpeakingMessageIndex(messageIndex);
                    setSpeechUtterance(utterance);
                };

                utterance.onend = () => {
                    setSpeakingMessageIndex(null);
                    setSpeechUtterance(null);
                };

                utterance.onerror = () => {
                    setSpeakingMessageIndex(null);
                    setSpeechUtterance(null);
                };

                // Start speaking
                window.speechSynthesis.speak(utterance);
            } else {
                alert('Speech synthesis is not supported in your browser');
            }
        };

        // Check if speech synthesis is available
        if (!('speechSynthesis' in window)) {
            return null;
        }

        return (
            <button
                onClick={handleSpeak}
                className="ml-3 p-2 rounded-lg transition-all duration-300 hover:scale-110 relative overflow-hidden group"
                style={{
                    backgroundColor: isSpeaking
                        ? enhancedColors.error + '20'
                        : enhancedColors.primary + '20',
                    color: isSpeaking ? enhancedColors.error : enhancedColors.primary,
                    border: `1px solid ${isSpeaking ? enhancedColors.error + '40' : enhancedColors.primary + '40'}`,
                    boxShadow: isSpeaking ? `0 0 10px ${enhancedColors.error}40` : `0 0 10px ${enhancedColors.primary}40`
                }}
                title={isSpeaking ? 'Stop Speaking' : 'Speak Answer'}
            >
                <span className="relative z-10">
                    {isSpeaking ? (
                        <i className="fas fa-stop text-sm" />
                    ) : (
                        <i className="fas fa-volume-up text-sm" />
                    )}
                </span>

                {/* Pulse animation when speaking */}
                {isSpeaking && (
                    <div
                        className="absolute inset-0 rounded-lg animate-ping"
                        style={{ backgroundColor: enhancedColors.error + '20' }}
                    />
                )}

                {/* Hover effect */}
                <div
                    className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"
                />
            </button>
        );
    };

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (notebookId) {
            fetchNotebookData();
        } else {
            setNotebookLoading(false);
        }
    }, [notebookId]);

    // Auto-open modal if no sources and no notebook
    useEffect(() => {
        if (!notebookLoading && sources.length === 0 && !notebookId) {
            const timer = setTimeout(() => {
                setIsModalOpen(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [sources.length, notebookLoading, notebookId]);

    // Load existing Q&A pairs when notebook data is loaded
    useEffect(() => {
        if (notebookData && notebookData.questions_answers) {
            const existingMessages = [];
            notebookData.questions_answers.forEach(qa => {
                existingMessages.push({ type: 'user', content: qa.question });
                existingMessages.push({ type: 'ai', content: qa.answer });
            });
            setMessages(existingMessages);
        }
    }, [notebookData]);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const fetchNotebookData = async () => {
        try {
            setNotebookLoading(true);
            const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setNotebookData(data);

            const pdfSources = [{
                id: notebookId,
                name: data.pdf_filename,
                sourceType: 'file',
                status: 'completed',
                notebook_id: notebookId
            }];

            setSources(pdfSources);
            setSelectedDocuments([notebookId]);
        } catch (error) {
            console.error('Error fetching notebook data:', error);
        } finally {
            setNotebookLoading(false);
        }
    };

    const handleAddSource = (sourceData) => {
        setSources(prev => [...prev, { ...sourceData, status: 'completed' }]);
        setSelectedDocuments(prev => [...prev, sourceData.id]);
    };

    const handleDocumentSelection = (documentId, isSelected) => {
        setSelectedDocuments(prev => {
            if (isSelected) {
                return [...prev, documentId];
            } else {
                return prev.filter(id => id !== documentId);
            }
        });
    };

    const handleGetAudioSummary = async () => {
        if (!notebookId) return;

        setIsLoadingAudio(true);

        const audioMessage = {
            type: 'system',
            content: 'Generating audio summary...',
            isLoading: true
        };
        setMessages(prev => [...prev, audioMessage]);

        try {
            const response = await fetch(`${API_BASE_URL}/get-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notebook_id: notebookId,
                    notebook_content: notebookData
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAudioUrl(data.audioUrl);

                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        type: 'audio',
                        content: 'Audio summary generated successfully!',
                        audioUrl: data.audioUrl
                    }
                ]);
            } else {
                throw new Error('Failed to generate audio summary');
            }
        } catch (error) {
            console.error('Error generating audio summary:', error);
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    type: 'system',
                    content: 'Failed to generate audio summary. Please try again.',
                    isError: true
                }
            ]);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        if (selectedDocuments.length === 0) {
            alert('Please select at least one document');
            return;
        }

        // Stop any current speech when asking new question
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setSpeakingMessageIndex(null);
            setSpeechUtterance(null);
        }

        const userMessage = { type: 'user', content: question };
        setMessages(prev => [...prev, userMessage]);

        const currentQuestion = question;
        setQuestion('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/query-notebook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: currentQuestion,
                    notebook_id: notebookId,
                    notebook_content: notebookData
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const aiMessage = {
                    type: 'ai',
                    content: data.answer || 'No answer received'
                };
                setMessages(prev => [...prev, aiMessage]);

                setNotebookData(prev => ({
                    ...prev,
                    total_questions: data.total_questions,
                    questions_answers: [
                        ...(prev.questions_answers || []),
                        {
                            question: currentQuestion,
                            answer: data.answer,
                            question_id: data.question_id,
                            created_at: data.updated_at
                        }
                    ]
                }));
            } else {
                throw new Error('Failed to process question');
            }
        } catch (error) {
            console.error('Error asking question:', error);
            const errorMessage = {
                type: 'ai',
                content: 'Sorry, I encountered an error while processing your question.',
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const getSourceIcon = (sourceType) => {
        switch (sourceType) {
            case 'file':
                return 'fas fa-file-pdf';
            case 'url':
                return 'fas fa-link';
            case 'text':
                return 'fas fa-clipboard';
            default:
                return 'fas fa-file';
        }
    };

    if (notebookLoading) {
        return (
            <div
                className="flex h-screen items-center justify-center relative overflow-hidden"
                style={{
                    background: isDarkMode
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                }}
            >
                <div className="absolute inset-0 opacity-20">
                    <div
                        className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
                        style={{ backgroundColor: enhancedColors.primary }}
                    />
                    <div
                        className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse"
                        style={{ backgroundColor: enhancedColors.secondary, animationDelay: '2s' }}
                    />
                </div>

                <div className="text-center relative z-10">
                    <div className="relative mb-8">
                        <div
                            className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-transparent"
                            style={{
                                borderColor: enhancedColors.primary,
                                borderTopColor: 'transparent',
                                boxShadow: enhancedColors.glow
                            }}
                        />
                    </div>
                    <p
                        className="text-xl font-medium"
                        style={{ color: enhancedColors.textSecondary }}
                    >
                        Loading notebook...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex h-screen overflow-hidden relative"
            style={{
                background: isDarkMode
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            }}
        >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
                    style={{ backgroundColor: enhancedColors.primary }}
                />
                <div
                    className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl"
                    style={{ backgroundColor: enhancedColors.secondary }}
                />
            </div>

            {/* Enhanced Left Sidebar (same as before) */}
            <div
                className="w-80 border-r flex flex-col backdrop-blur-xl relative z-10"
                style={{
                    borderColor: enhancedColors.border,
                    backgroundColor: enhancedColors.sidebarBackground + (isDarkMode ? 'e6' : 'f0'),
                    boxShadow: enhancedColors.shadow
                }}
            >
                {/* Sidebar Header */}
                <div
                    className="p-6 border-b relative overflow-hidden"
                    style={{ borderColor: enhancedColors.border }}
                >
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2
                                    className="text-xl font-bold mb-1"
                                    style={{ color: enhancedColors.textPrimary }}
                                >
                                    Documents
                                </h2>
                                <p
                                    className="text-sm"
                                    style={{ color: enhancedColors.textSecondary }}
                                >
                                    {sources.length} file{sources.length !== 1 ? 's' : ''} uploaded
                                </p>
                            </div>
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{
                                    background: `linear-gradient(135deg, ${enhancedColors.primary}20 0%, ${enhancedColors.primary}30 100%)`,
                                    border: `1px solid ${enhancedColors.primary}40`
                                }}
                            >
                                <i
                                    className="fas fa-folder text-lg"
                                    style={{ color: enhancedColors.primary }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={openModal}
                            className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 relative overflow-hidden group"
                            style={{
                                background: `linear-gradient(135deg, ${enhancedColors.primary} 0%, ${enhancedColors.primaryHover} 100%)`,
                                color: 'white',
                                boxShadow: enhancedColors.glow
                            }}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                <i className="fas fa-plus mr-3"></i>
                                Add Files
                            </span>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        </button>
                    </div>
                </div>

                {/* Sources List (same as before) */}
                <div className="flex-1 overflow-y-auto p-6">
                    {sources.length === 0 ? (
                        <div className="text-center py-12">
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${enhancedColors.primary}10 0%, ${enhancedColors.primary}20 100%)`,
                                    border: `2px dashed ${enhancedColors.primary}40`
                                }}
                            >
                                <i
                                    className="fas fa-folder-open text-2xl"
                                    style={{ color: enhancedColors.primary }}
                                />
                            </div>
                            <h3
                                className="font-semibold text-lg mb-2"
                                style={{ color: enhancedColors.textPrimary }}
                            >
                                No documents yet
                            </h3>
                            <p
                                className="text-sm leading-relaxed"
                                style={{ color: enhancedColors.textSecondary }}
                            >
                                Click "Add Files" to upload your documents and start asking questions!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sources.map((source, index) => (
                                <div
                                    key={source.id}
                                    className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer transform hover:scale-105 backdrop-blur-sm ${selectedDocuments.includes(source.id) ? 'shadow-lg' : ''
                                        }`}
                                    style={{
                                        backgroundColor: selectedDocuments.includes(source.id)
                                            ? enhancedColors.primary + '15'
                                            : enhancedColors.cardBackground + '80',
                                        borderColor: selectedDocuments.includes(source.id)
                                            ? enhancedColors.primary
                                            : enhancedColors.border,
                                        boxShadow: selectedDocuments.includes(source.id)
                                            ? enhancedColors.glow
                                            : 'none'
                                    }}
                                    onClick={() => handleDocumentSelection(source.id, !selectedDocuments.includes(source.id))}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocuments.includes(source.id)}
                                                onChange={(e) => handleDocumentSelection(source.id, e.target.checked)}
                                                className="mr-3 w-4 h-4 rounded"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: `linear-gradient(135deg, ${enhancedColors.primary}20 0%, ${enhancedColors.primary}30 100%)`,
                                                    border: `1px solid ${enhancedColors.primary}40`
                                                }}
                                            >
                                                <i
                                                    className={getSourceIcon(source.sourceType)}
                                                    style={{ color: enhancedColors.primary }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="font-semibold text-sm mb-1"
                                                style={{ color: enhancedColors.textPrimary }}
                                            >
                                                Document {index + 1}
                                            </p>
                                            <p
                                                className="text-xs truncate"
                                                style={{ color: enhancedColors.textSecondary }}
                                            >
                                                {source.name}
                                            </p>
                                            <div
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2"
                                                style={{
                                                    backgroundColor: enhancedColors.success + '20',
                                                    color: enhancedColors.success
                                                }}
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full mr-2"
                                                    style={{ backgroundColor: enhancedColors.success }}
                                                />
                                                Ready
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Main Content Area */}
            <div className="flex-1 flex flex-col relative z-10">
                {/* Chat Messages Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-6 backdrop-blur-sm"
                    style={{
                        paddingBottom: '120px',
                        backgroundColor: enhancedColors.chatBackground + (isDarkMode ? '80' : 'f0')
                    }}
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center max-w-lg">
                                <div
                                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(135deg, ${enhancedColors.primary}20 0%, ${enhancedColors.secondary}20 100%)`,
                                        border: `2px solid ${enhancedColors.primary}30`
                                    }}
                                >
                                    <i
                                        className="fas fa-comments text-3xl"
                                        style={{ color: enhancedColors.primary }}
                                    />
                                    <div
                                        className="absolute inset-0 rounded-full animate-pulse"
                                        style={{ backgroundColor: enhancedColors.primary + '10' }}
                                    />
                                </div>
                                <h3
                                    className="text-2xl font-bold mb-4"
                                    style={{ color: enhancedColors.textPrimary }}
                                >
                                    Ready to explore your documents!
                                </h3>
                                <p
                                    className="text-lg mb-8 leading-relaxed"
                                    style={{ color: enhancedColors.textSecondary }}
                                >
                                    Ask questions about your uploaded documents or generate an audio summary to get started.
                                </p>

                                {sources.length > 0 && (
                                    <button
                                        onClick={handleGetAudioSummary}
                                        disabled={isLoadingAudio || selectedDocuments.length === 0}
                                        className="py-4 px-8 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-105 relative overflow-hidden group"
                                        style={{
                                            background: `linear-gradient(135deg, ${enhancedColors.secondary} 0%, ${enhancedColors.primary} 100%)`,
                                            color: 'white',
                                            boxShadow: enhancedColors.glow
                                        }}
                                    >
                                        <span className="relative z-10 flex items-center">
                                            <i className="fas fa-volume-up mr-3"></i>
                                            {isLoadingAudio ? 'Generating Summary...' : 'Get Audio Summary'}
                                        </span>
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            {/* Audio Summary Button at top of chat */}
                            {sources.length > 0 && (
                                <div className="flex justify-center mb-8">
                                    <button
                                        onClick={handleGetAudioSummary}
                                        disabled={isLoadingAudio || selectedDocuments.length === 0}
                                        className="py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-105 backdrop-blur-sm border"
                                        style={{
                                            backgroundColor: enhancedColors.cardBackground + '80',
                                            color: enhancedColors.primary,
                                            borderColor: enhancedColors.border
                                        }}
                                    >
                                        <i className="fas fa-volume-up mr-2"></i>
                                        {isLoadingAudio ? 'Generating Summary...' : 'Get Audio Summary'}
                                    </button>
                                </div>
                            )}

                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.type === 'user'
                                        ? 'justify-end'
                                        : message.type === 'system'
                                            ? 'justify-center'
                                            : 'justify-start'
                                        }`}
                                >
                                    <div className="flex items-start space-x-3 max-w-[75%]">
                                        <div
                                            className={`p-5 rounded-2xl backdrop-blur-sm border relative overflow-hidden ${message.type === 'user'
                                                ? 'rounded-br-sm'
                                                : message.type === 'system'
                                                    ? 'rounded-full px-8 py-3'
                                                    : 'rounded-bl-sm'
                                                }`}
                                            style={{
                                                background: message.type === 'user'
                                                    ? `linear-gradient(135deg, ${enhancedColors.primary} 0%, ${enhancedColors.primaryHover} 100%)`
                                                    : message.type === 'system'
                                                        ? message.isError
                                                            ? `linear-gradient(135deg, ${enhancedColors.error}20 0%, ${enhancedColors.error}30 100%)`
                                                            : `linear-gradient(135deg, ${enhancedColors.textSecondary}20 0%, ${enhancedColors.textSecondary}30 100%)`
                                                        : enhancedColors.messageBackground + '80',
                                                color: message.type === 'user'
                                                    ? 'white'
                                                    : message.type === 'system'
                                                        ? message.isError
                                                            ? enhancedColors.error
                                                            : enhancedColors.textSecondary
                                                        : enhancedColors.textPrimary,
                                                borderColor: message.type === 'user'
                                                    ? enhancedColors.primary + '40'
                                                    : enhancedColors.border,
                                                boxShadow: message.type === 'user'
                                                    ? enhancedColors.glow
                                                    : enhancedColors.shadow
                                            }}
                                        >
                                            {message.isLoading && (
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <div className="flex space-x-1">
                                                        <div
                                                            className="w-2 h-2 rounded-full animate-bounce"
                                                            style={{ backgroundColor: enhancedColors.primary }}
                                                        />
                                                        <div
                                                            className="w-2 h-2 rounded-full animate-bounce"
                                                            style={{
                                                                backgroundColor: enhancedColors.primary,
                                                                animationDelay: '0.1s'
                                                            }}
                                                        />
                                                        <div
                                                            className="w-2 h-2 rounded-full animate-bounce"
                                                            style={{
                                                                backgroundColor: enhancedColors.primary,
                                                                animationDelay: '0.2s'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="whitespace-pre-wrap relative z-10">
                                                {message.content}
                                            </div>

                                            {/* Enhanced Audio Player */}
                                            {message.type === 'audio' && message.audioUrl && (
                                                <div
                                                    className="mt-4 p-4 rounded-xl border"
                                                    style={{
                                                        backgroundColor: enhancedColors.cardBackground + '60',
                                                        borderColor: enhancedColors.border
                                                    }}
                                                >
                                                    <div className="flex items-center mb-3">
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                                                            style={{
                                                                backgroundColor: enhancedColors.success + '20',
                                                                color: enhancedColors.success
                                                            }}
                                                        >
                                                            <i className="fas fa-play text-xs" />
                                                        </div>
                                                        <span
                                                            className="text-sm font-medium"
                                                            style={{ color: enhancedColors.textPrimary }}
                                                        >
                                                            Audio Summary
                                                        </span>
                                                    </div>
                                                    <audio
                                                        controls
                                                        src={message.audioUrl}
                                                        className="w-full"
                                                        style={{
                                                            height: '45px',
                                                            borderRadius: '8px'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Speech Button for AI messages */}
                                        {message.type === 'ai' && !message.isError && (
                                            <SpeechButton
                                                text={message.content}
                                                messageIndex={index}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Enhanced Loading State */}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div
                                        className="max-w-[75%] p-5 rounded-2xl rounded-bl-sm backdrop-blur-sm border"
                                        style={{
                                            backgroundColor: enhancedColors.messageBackground + '80',
                                            borderColor: enhancedColors.border,
                                            boxShadow: enhancedColors.shadow
                                        }}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex space-x-1">
                                                <div
                                                    className="w-3 h-3 rounded-full animate-bounce"
                                                    style={{ backgroundColor: enhancedColors.primary }}
                                                />
                                                <div
                                                    className="w-3 h-3 rounded-full animate-bounce"
                                                    style={{
                                                        backgroundColor: enhancedColors.primary,
                                                        animationDelay: '0.1s'
                                                    }}
                                                />
                                                <div
                                                    className="w-3 h-3 rounded-full animate-bounce"
                                                    style={{
                                                        backgroundColor: enhancedColors.primary,
                                                        animationDelay: '0.2s'
                                                    }}
                                                />
                                            </div>
                                            <span
                                                className="text-sm font-medium"
                                                style={{ color: enhancedColors.textSecondary }}
                                            >
                                                Processing your question...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Enhanced Bottom Search Bar (same as before) */}
                <div
                    className="p-6 border-t backdrop-blur-xl relative z-20"
                    style={{
                        borderColor: enhancedColors.border,
                        backgroundColor: enhancedColors.sidebarBackground + (isDarkMode ? 'f0' : 'f8'),
                        position: 'fixed',
                        bottom: 0,
                        right: 0,
                        left: '320px',
                        boxShadow: `0 -10px 40px ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`
                    }}
                >
                    <form onSubmit={handleQuestionSubmit} className="max-w-4xl mx-auto">
                        <div className="flex space-x-4">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder={
                                        sources.length === 0
                                            ? "Upload documents first to ask questions..."
                                            : selectedDocuments.length === 0
                                                ? "Select documents to ask questions..."
                                                : "Ask a question about your documents..."
                                    }
                                    className="w-full px-6 py-4 rounded-xl border-2 focus:ring-0 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                                    style={{
                                        backgroundColor: enhancedColors.cardBackground + '80',
                                        borderColor: question.trim() ? enhancedColors.primary : enhancedColors.border,
                                        color: enhancedColors.textPrimary,
                                        boxShadow: question.trim() ? enhancedColors.glow : 'none'
                                    }}
                                    disabled={isLoading || sources.length === 0 || selectedDocuments.length === 0}
                                />
                                {question.trim() && (
                                    <div
                                        className="absolute inset-0 rounded-xl -z-10 blur animate-pulse"
                                        style={{ backgroundColor: enhancedColors.primary + '20' }}
                                    />
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !question.trim() || sources.length === 0 || selectedDocuments.length === 0}
                                className="px-6 py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 transform hover:scale-105 relative overflow-hidden group"
                                style={{
                                    background: question.trim() && !isLoading
                                        ? `linear-gradient(135deg, ${enhancedColors.primary} 0%, ${enhancedColors.primaryHover} 100%)`
                                        : enhancedColors.textSecondary + '20',
                                    color: question.trim() && !isLoading ? 'white' : enhancedColors.textSecondary,
                                    boxShadow: question.trim() && !isLoading ? enhancedColors.glow : 'none'
                                }}
                            >
                                <span className="relative z-10">
                                    {isLoading ? (
                                        <i className="fas fa-spinner fa-spin text-lg" />
                                    ) : (
                                        <i className="fas fa-paper-plane text-lg" />
                                    )}
                                </span>
                                {question.trim() && !isLoading && (
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                                )}
                            </button>
                        </div>

                        {selectedDocuments.length > 0 && (
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center space-x-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: enhancedColors.success }}
                                    />
                                    <span
                                        className="text-sm"
                                        style={{ color: enhancedColors.textSecondary }}
                                    >
                                        {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                                    </span>
                                </div>
                                <div
                                    className="text-xs px-3 py-1 rounded-full"
                                    style={{
                                        backgroundColor: enhancedColors.success + '20',
                                        color: enhancedColors.success
                                    }}
                                >
                                    Ready to chat
                                </div>
                            </div>
                        )}
                    </form>
                </div>
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

export default UploadPage;
