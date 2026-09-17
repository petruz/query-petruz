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
    // Available themes
    const availableThemes = ['dark', 'light', 'green-ambient'];

    // Initialize theme from localStorage or default to 'dark'
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('qm_theme');
        return savedTheme && availableThemes.includes(savedTheme) ? savedTheme : 'dark';
    });

    // Apply theme to document root
    useEffect(() => {
        const root = document.documentElement;

        // Remove all theme data attributes
        availableThemes.forEach(t => {
            if (root.getAttribute('data-theme') === t) {
                root.removeAttribute('data-theme');
            }
        });

        // Apply new theme (only if not dark, which is the default)
        if (theme !== 'dark') {
            root.setAttribute('data-theme', theme);
        }

        // Save to localStorage
        localStorage.setItem('qm_theme', theme);
    }, [theme]);

    const switchTheme = (newTheme) => {
        if (availableThemes.includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    const value = {
        theme,
        availableThemes,
        switchTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
