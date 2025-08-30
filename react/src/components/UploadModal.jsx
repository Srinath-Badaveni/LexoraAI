import React, { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const UploadModal = ({ isOpen, onClose, onAddSource }) => {
    const { colors } = useTheme();
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [textInput, setTextInput] = useState('');
    const [activeTab, setActiveTab] = useState('upload');
    const fileInputRef = useRef(null);

    // Base URL for our RAG API
    const API_BASE_URL = 'http://localhost:8001/hackrx';

    const getAuthToken = () => localStorage.getItem('token');

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(Array.from(e.dataTransfer.files));
    };

    const handleFileInput = (e) => handleFiles(Array.from(e.target.files));

    const handleFiles = (files) => {
        const newFiles = files.map((file) => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            file,
            status: 'ready',
        }));
        setUploadedFiles((prev) => [...prev, ...newFiles]);
        setActiveTab('upload');
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'uploading': return 'fas fa-spinner fa-spin';
            case 'completed': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            default: return 'fas fa-file';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'uploading': return colors.primary;
            case 'completed': return colors.success || '#10B981';
            case 'error': return colors.error || '#EF4444';
            default: return colors.primary;
        }
    };

    const removeFile = (fileId) => {
        setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    const openFileDialog = () => fileInputRef.current?.click();

    // 1) Upload files to create a notebook
    const handleUpload = async () => {
        if (!uploadedFiles.length) return;
        setIsUploading(true);
        const token = getAuthToken();
        // if (!token) {
        //     alert('Please login to upload files');
        //     setIsUploading(false);
        //     return;
        // }

        try {
            setUploadedFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' })));
            for (const fileObj of uploadedFiles) {
                if (!fileObj.name.toLowerCase().endsWith('.pdf')) {
                    throw new Error('Only PDF files are supported');
                }
                const formData = new FormData();
                formData.append('file', fileObj.file);
                const response = await fetch(`${API_BASE_URL}/create-notebook`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
                if (!response.ok) throw new Error('Upload failed');
                const data = await response.json();

                setUploadedFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileObj.id ? { ...f, status: 'completed' } : f
                    )
                );
                // Notify parent with new notebook source
                onAddSource?.({
                    id: data.notebook_id,
                    name: data.title,
                    type: 'notebook',
                    sourceType: 'file',
                    pdfFilename: data.pdf_filename,
                    createdAt: data.created_at,
                });
            }
            // Close modal after a moment
            setTimeout(() => {
                onClose();
                setUploadedFiles([]);
            }, 1000);
        } catch (err) {
            console.error(err);
            alert(err.message || 'Upload failed');
            setUploadedFiles((prev) =>
                prev.map((f) => ({ ...f, status: 'error' }))
            );
        } finally {
            setIsUploading(false);
        }
    };

    // 2) Add URL source
    const handleUrlSubmit = async (e) => {
        e.preventDefault();
        if (!urlInput.trim()) return;
        setIsUploading(true);
        const token = getAuthToken();
        if (!token) {
            alert('Please login to add URL sources');
            setIsUploading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/run`, {
                method: 'POST', // reuse `run` to fetch and process URL PDF
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    documents: urlInput.trim(),
                    questions: [], // no questions yet
                }),
            });
            if (!response.ok) throw new Error('URL submission failed');
            const data = await response.json();
            // `run` doesn't return notebook metadata, so treat URL as a source record
            onAddSource?.({
                id: urlInput.trim(),
                name: urlInput.trim(),
                type: 'url',
                sourceType: 'url',
                status: 'completed',
            });
            setUrlInput('');
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to add URL source. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // 3) Add text source
    const handleTextSubmit = async (e) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        setIsUploading(true);
        const token = getAuthToken();
        if (!token) {
            alert('Please login to add text sources');
            setIsUploading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    documents: '', // empty doc URL
                    questions: [],
                }),
            });
            if (!response.ok) throw new Error('Text source failed');
            // Treat text as ad-hoc source
            onAddSource?.({
                id: Date.now(),
                name: `Text Input – ${new Date().toLocaleString()}`,
                type: 'text',
                sourceType: 'text',
                status: 'completed',
            });
            setTextInput('');
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to add text source. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                style={{ backgroundColor: colors.background }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border }}>
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                            Add Source
                        </h2>
                        <p className="mt-1" style={{ color: colors.textSecondary }}>
                            Sources let StudyMate base its responses on the information that matters most to you.
                        </p>
                        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                            (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
                        style={{ color: colors.textSecondary, backgroundColor: colors.textSecondary + '10' }}
                    >
                        <i className="fas fa-times text-xl" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Tabs */}
                    <div className="flex space-x-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: colors.surface }}>
                        {[
                            { id: 'upload', label: 'Upload Files', icon: 'fas fa-upload' },
                            { id: 'url', label: 'Add URL', icon: 'fas fa-link' },
                            { id: 'text', label: 'Add Text', icon: 'fas fa-clipboard' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-all ${activeTab === tab.id ? 'shadow-sm' : ''
                                    }`}
                                style={{
                                    backgroundColor: activeTab === tab.id ? colors.background : 'transparent',
                                    color: activeTab === tab.id ? colors.text : colors.textSecondary,
                                }}
                            >
                                <i className={`${tab.icon} mr-2`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'upload' && (
                        <>
                            {/* Drag & Drop */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? 'border-opacity-80' : 'border-opacity-40'
                                    }`}
                                style={{
                                    borderColor: colors.primary + (dragActive ? '80' : '40'),
                                    backgroundColor: colors.primary + '05',
                                }}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <i className="fas fa-cloud-upload-alt text-4xl mb-4" style={{ color: colors.primary }} />
                                <p className="mb-2" style={{ color: colors.text }}>
                                    <strong>Drag & drop</strong> or{' '}
                                    <button
                                        onClick={openFileDialog}
                                        className="font-medium hover:underline"
                                        style={{ color: colors.primary }}
                                        disabled={isUploading}
                                    >
                                        choose file
                                    </button>{' '}
                                    to upload
                                </p>
                                <p className="text-sm" style={{ color: colors.textSecondary }}>
                                    Supported: PDF only
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileInput}
                                    className="hidden"
                                    multiple
                                    accept=".pdf"
                                />
                            </div>

                            {/* Files List */}
                            {uploadedFiles.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="font-medium mb-3" style={{ color: colors.text }}>
                                        Files to Upload ({uploadedFiles.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between p-3 rounded-lg"
                                                style={{ backgroundColor: colors.surface }}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <i className={getStatusIcon(file.status)} style={{ color: getStatusColor(file.status) }} />
                                                    <div>
                                                        <p className="font-medium" style={{ color: colors.text }}>
                                                            {file.name}
                                                        </p>
                                                        <p className="text-sm" style={{ color: colors.textSecondary }}>
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {file.status === 'ready' && (
                                                    <button
                                                        onClick={() => removeFile(file.id)}
                                                        className="p-1 rounded hover:bg-opacity-10"
                                                        style={{ color: colors.textSecondary }}
                                                    >
                                                        <i className="fas fa-times" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleUpload}
                                        disabled={isUploading || uploadedFiles.length === 0}
                                        className="w-full mt-4 py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50"
                                        style={{
                                            backgroundColor: colors.primary,
                                            color: 'white',
                                        }}
                                    >
                                        {isUploading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-2" />
                                                Uploading...
                                            </>
                                        ) : (
                                            `Upload ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}`
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'url' && (
                        <form onSubmit={handleUrlSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                                    Enter PDF URL
                                </label>
                                <input
                                    type="url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://example.com/document.pdf"
                                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all"
                                    style={{
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                    disabled={isUploading}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isUploading || !urlInput.trim()}
                                className="w-full py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50"
                                style={{
                                    backgroundColor: colors.primary,
                                    color: 'white',
                                }}
                            >
                                {isUploading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2" />
                                        Adding URL...
                                    </>
                                ) : (
                                    'Add URL Source'
                                )}
                            </button>
                        </form>
                    )}

                    {activeTab === 'text' && (
                        <form onSubmit={handleTextSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                                    Paste or type your text
                                </label>
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Paste your text content here..."
                                    rows={8}
                                    className="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all resize-vertical"
                                    style={{
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    }}
                                    disabled={isUploading}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isUploading || !textInput.trim()}
                                className="w-full py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50"
                                style={{
                                    backgroundColor: colors.primary,
                                    color: 'white',
                                }}
                            >
                                {isUploading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2" />
                                        Adding Text...
                                    </>
                                ) : (
                                    'Add Text Source'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
