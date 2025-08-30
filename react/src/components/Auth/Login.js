// components/Auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext'; // You'll need to create this

const Login = () => {
    const { colors } = useTheme();
    const navigate = useNavigate();
    const { login } = useAuth(); // Authentication context
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Basic validation
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.toLowerCase().trim(),
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store authentication data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Update auth context
                login(data.user, data.token);

                // Navigate to dashboard
                navigate('/');
            } else {
                // Handle different error scenarios
                switch (response.status) {
                    case 401:
                        setError('Invalid email or password');
                        break;
                    case 404:
                        setError('Account not found. Please check your email or sign up.');
                        break;
                    case 429:
                        setError('Too many login attempts. Please try again later.');
                        break;
                    case 500:
                        setError('Server error. Please try again later.');
                        break;
                    default:
                        setError(data.message || 'Login failed. Please try again.');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
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
            className="min-h-screen flex items-center justify-center px-4"
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
                        Welcome Back
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                    >
                        Sign in to your StudyMate account
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
                <form onSubmit={handleSubmit} className="space-y-6">
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
                            placeholder="Enter your email"
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
                            placeholder="Enter your password"
                        />
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-right">
                        <Link
                            to="/forgot-password"
                            className="text-sm transition-colors duration-200"
                            style={{ color: colors.primary }}
                            onMouseEnter={(e) => {
                                e.target.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.textDecoration = 'none';
                            }}
                        >
                            Forgot your password?
                        </Link>
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
                                Signing In...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-sign-in-alt mr-2"></i>
                                Sign In
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

                {/* Social Login Options */}
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

                {/* Sign Up Link */}
                <div className="mt-8 text-center">
                    <span
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                    >
                        Don't have an account?{' '}
                    </span>
                    <Link
                        to="/signup"
                        className="text-sm font-medium transition-colors duration-200"
                        style={{ color: colors.primary }}
                        onMouseEnter={(e) => {
                            e.target.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.textDecoration = 'none';
                        }}
                    >
                        Sign up here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
