import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const MenuDropdown = ({ label, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const dropdownRef = useRef(null);
    const submenuTimeoutRef = useRef(null);

    const clearSubmenuTimeout = () => {
        if (submenuTimeoutRef.current) {
            clearTimeout(submenuTimeoutRef.current);
            submenuTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                clearSubmenuTimeout();
                setIsOpen(false);
                setOpenSubmenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            clearSubmenuTimeout();
        };
    }, []);

    const handleMouseEnterSubmenu = (index) => {
        clearSubmenuTimeout();
        setOpenSubmenu(index);
    };

    const handleMouseLeaveSubmenu = () => {
        clearSubmenuTimeout();
        submenuTimeoutRef.current = setTimeout(() => {
            setOpenSubmenu(null);
        }, 250);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className={`px-3 py-1 text-sm text-[var(--menu-text)] hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)] rounded flex items-center gap-1 transition-colors ${isOpen ? 'bg-[var(--menu-hover-bg)] text-[var(--menu-hover-text)]' : ''}`}
                onClick={() => {
                    clearSubmenuTimeout();
                    setIsOpen(!isOpen);
                    setOpenSubmenu(null);
                }}
            >
                {label}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--menu-dropdown-bg)] border border-[var(--menu-dropdown-border)] rounded shadow-lg z-50 py-1">
                    {items.map((item, index) => (
                        item.submenu ? (
                            <div
                                key={index}
                                className="relative"
                                onMouseEnter={() => handleMouseEnterSubmenu(index)}
                                onMouseLeave={handleMouseLeaveSubmenu}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearSubmenuTimeout();
                                        setOpenSubmenu(openSubmenu === index ? null : index);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-[var(--menu-text)] hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)] transition-colors flex items-center justify-between"
                                >
                                    {item.label}
                                    <span className="text-xs">▶</span>
                                </button>

                                {openSubmenu === index && (
                                    <div
                                        className="absolute left-full top-0 -ml-1 pl-2 w-44 z-50"
                                        onMouseEnter={() => handleMouseEnterSubmenu(index)}
                                        onMouseLeave={handleMouseLeaveSubmenu}
                                    >
                                        <div className="w-40 bg-[var(--menu-dropdown-bg)] border border-[var(--menu-dropdown-border)] rounded shadow-lg py-1">
                                            {item.submenu.map((subItem, subIndex) => (
                                                <button
                                                    key={subIndex}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2 text-sm text-[var(--menu-text)] hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)] transition-colors flex items-center justify-between"
                                                    onClick={() => {
                                                        clearSubmenuTimeout();
                                                        subItem.onClick?.();
                                                        setIsOpen(false);
                                                        setOpenSubmenu(null);
                                                    }}
                                                >
                                                    <span className="capitalize">{subItem.label}</span>
                                                    {subItem.isActive && <Check size={14} className="text-blue-400" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                key={index}
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm text-[var(--menu-text)] hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)] transition-colors"
                                onClick={() => {
                                    clearSubmenuTimeout();
                                    item.onClick?.();
                                    setIsOpen(false);
                                    setOpenSubmenu(null);
                                }}
                            >
                                {item.label}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
};

const MenuBar = ({ onOpenLibrary, onSaveLibrary, onNewConnection, onLoadConnections, onSaveConnections, onImportDriver, onAbout, onOpenSettings, currentTheme, availableThemes, onThemeChange }) => {
    return (
        <div className="flex items-center px-2 py-1 bg-[var(--menu-bg)] border-b border-[var(--menu-border)] select-none">
            <MenuDropdown
                label="File"
                items={[
                    { label: 'Open Library', onClick: onOpenLibrary },
                    { label: 'Save Library', onClick: onSaveLibrary },
                ]}
            />
            <MenuDropdown
                label="Connection"
                items={[
                    { label: 'New Connection', onClick: onNewConnection },
                    { label: 'Import JDBC Driver...', onClick: onImportDriver },
                    { label: 'Load Connections', onClick: onLoadConnections },
                    { label: 'Save Connections', onClick: onSaveConnections },
                ]}
            />
            <MenuDropdown
                label="Options"
                items={[
                    {
                        label: 'Theme',
                        submenu: availableThemes?.map(theme => ({
                            label: theme,
                            isActive: theme === currentTheme,
                            onClick: () => onThemeChange?.(theme)
                        })) || []
                    },
                    { label: 'Settings', onClick: onOpenSettings },
                ]}
            />
            <MenuDropdown
                label="Help"
                items={[
                    { label: 'About', onClick: onAbout },
                ]}
            />
        </div>
    );
};

export default MenuBar;

