// contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check if there's a saved theme preference in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        // Default to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const toggleTheme = () => {
        setIsDarkMode(prevMode => {
            const newMode = !prevMode;
            localStorage.setItem('theme', newMode ? 'dark' : 'light');
            return newMode;
        });
    };

    const theme = {
        colors: {
            // Light mode colors
            light: {
                primary: '#2563eb',
                secondary: '#64748b',
                background: '#ffffff',
                surface: '#f8fafc',
                surfaceHover: '#f1f5f9',
                text: '#1e293b',
                textSecondary: '#64748b',
                textMuted: '#94a3b8',
                border: '#e2e8f0',
                borderHover: '#cbd5e1',
                input: '#ffffff',
                inputBorder: '#d1d5db',
                error: '#ef4444',
                success: '#10b981',
                card: '#ffffff',
                cardHover: '#f8fafc'
            },
            // Dark mode colors
            dark: {
                primary: '#3b82f6',
                secondary: '#64748b',
                background: '#0f172a',
                surface: '#1e293b',
                surfaceHover: '#334155',
                text: '#f8fafc',
                textSecondary: '#cbd5e1',
                textMuted: '#64748b',
                border: '#334155',
                borderHover: '#475569',
                input: '#1e293b',
                inputBorder: '#374151',
                error: '#f87171',
                success: '#34d399',
                card: '#1e293b',
                cardHover: '#334155'
            }
        },
        current: isDarkMode ? 'dark' : 'light'
    };

    // Apply theme to document
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        document.body.style.backgroundColor = theme.colors[theme.current].background;
        document.body.style.color = theme.colors[theme.current].text;
    }, [isDarkMode, theme.colors, theme.current]);

    return (
        <ThemeContext.Provider value={{
            isDarkMode,
            toggleTheme,
            theme,
            colors: theme.colors[theme.current]
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
