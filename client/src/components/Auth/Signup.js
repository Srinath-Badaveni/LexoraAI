// components/Auth/Signup.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const Signup = () => {
    const { colors } = useTheme();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);

    const API_BASE_URL = 'http://localhost:8080';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.firstName.trim()) {
            setError('First name is required');
            return false;
        }
        if (!formData.lastName.trim()) {
            setError('Last name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (!acceptTerms) {
            setError('Please accept the terms and conditions');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email.toLowerCase().trim(),
                    password: formData.password,
                    acceptTerms: acceptTerms
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Update auth context
                login(data.user, data.token);

                // Navigate to onboarding or dashboard
                navigate('/onboarding');
            } else {
                // Handle different error scenarios
                switch (response.status) {
                    case 409:
                        setError('An account with this email already exists');
                        break;
                    case 400:
                        setError(data.message || 'Please check your information and try again');
                        break;
                    case 429:
                        setError('Too many registration attempts. Please try again later.');
                        break;
                    case 500:
                        setError('Server error. Please try again later.');
                        break;
                    default:
                        setError(data.message || 'Registration failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setError('Unable to connect to server. Please check your connection.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-8"
            style={{ backgroundColor: colors.background }}
        >
            <div
                className="w-full max-w-md p-8 rounded-xl shadow-lg"
                style={{ backgroundColor: colors.surface }}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                    >
                        <i className="fas fa-brain text-white text-2xl"></i>
                    </div>
                    <h1
                        className="text-2xl font-bold mb-2"
                        style={{ color: colors.text }}
                    >
                        Create Account
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                    >
                        Join StudyMate and start your learning journey
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        className="mb-4 p-3 rounded-lg border text-sm"
                        style={{
                            backgroundColor: `${colors.error || '#EF4444'}15`,
                            borderColor: colors.error || '#EF4444',
                            color: colors.error || '#EF4444'
                        }}
                    >
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: colors.text }}
                            >
                                First Name
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                                style={{
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = colors.primary;
                                    e.target.style.boxShadow = `0 0 0 2px ${colors.primary}25`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = colors.border;
                                    e.target.style.boxShadow = 'none';
                                }}
                                placeholder="John"
                            />
                        </div>
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: colors.text }}
                            >
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                                style={{
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = colors.primary;
                                    e.target.style.boxShadow = `0 0 0 2px ${colors.primary}25`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = colors.border;
                                    e.target.style.boxShadow = 'none';
                                }}
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    {/* Email Input */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.text }}
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                            style={{
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.primary;
                                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}25`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.border;
                                e.target.style.boxShadow = 'none';
                            }}
                            placeholder="john@example.com"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.text }}
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                            style={{
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.primary;
                                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}25`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.border;
                                e.target.style.boxShadow = 'none';
                            }}
                            placeholder="Create a strong password"
                        />
                        <p
                            className="text-xs mt-1"
                            style={{ color: colors.textMuted }}
                        >
                            Must be 8+ characters with uppercase, lowercase, and number
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: colors.text }}
                        >
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                            style={{
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.primary;
                                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}25`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.border;
                                e.target.style.boxShadow = 'none';
                            }}
                            placeholder="Confirm your password"
                        />
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            id="acceptTerms"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="mt-1"
                            style={{ accentColor: colors.primary }}
                        />
                        <label
                            htmlFor="acceptTerms"
                            className="text-sm flex-1"
                            style={{ color: colors.textSecondary }}
                        >
                            I agree to the{' '}
                            <Link
                                to="/terms"
                                className="transition-colors duration-200"
                                style={{ color: colors.primary }}
                                onMouseEnter={(e) => {
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.textDecoration = 'none';
                                }}
                            >
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link
                                to="/privacy"
                                className="transition-colors duration-200"
                                style={{ color: colors.primary }}
                                onMouseEnter={(e) => {
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.textDecoration = 'none';
                                }}
                            >
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: colors.primary }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = `0 4px 12px ${colors.primary}40`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }
                        }}
                    >
                        {isLoading ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-user-plus mr-2"></i>
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center">
                    <div
                        className="flex-1 border-t"
                        style={{ borderColor: colors.border }}
                    ></div>
                    <span
                        className="px-4 text-sm"
                        style={{ color: colors.textSecondary }}
                    >
                        or
                    </span>
                    <div
                        className="flex-1 border-t"
                        style={{ borderColor: colors.border }}
                    ></div>
                </div>

                {/* Social Signup Options */}
                <div className="space-y-3">
                    <button
                        className="w-full py-3 px-4 rounded-lg border transition-colors duration-200 flex items-center justify-center"
                        style={{
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                            color: colors.text
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = colors.surfaceHover;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = colors.background;
                        }}
                    >
                        <i className="fab fa-google mr-3 text-red-500"></i>
                        Continue with Google
                    </button>
                </div>

                {/* Login Link */}
                <div className="mt-8 text-center">
                    <span
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                    >
                        Already have an account?{' '}
                    </span>
                    <Link
                        to="/login"
                        className="text-sm font-medium transition-colors duration-200"
                        style={{ color: colors.primary }}
                        onMouseEnter={(e) => {
                            e.target.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.textDecoration = 'none';
                        }}
                    >
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
