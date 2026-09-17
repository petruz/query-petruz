import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage resizable panel layout
 * Handles sidebar, editor, and footer panel dimensions and resizing
 */
export function useLayout() {
    // Panel dimensions
    const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px
    const [editorHeight, setEditorHeight] = useState(300); // Default 300px
    const [footerHeight, setFooterHeight] = useState(32); // Default 32px
    const [isEditorVisible, setIsEditorVisible] = useState(true);

    // Resize state refs
    const isResizingSidebar = useRef(false);
    const isResizingEditor = useRef(false);
    const isResizingFooter = useRef(false);

    // Mouse move handler for resizing
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizingSidebar.current) {
                const newWidth = e.clientX;
                if (newWidth > 150 && newWidth < 600) setSidebarWidth(newWidth);
            }
            if (isResizingEditor.current && isEditorVisible) {
                const newHeight = e.clientY;
                if (newHeight > 100 && newHeight < window.innerHeight - 100) setEditorHeight(newHeight);
            }
            if (isResizingFooter.current) {
                const newHeight = window.innerHeight - e.clientY;
                if (newHeight > 24 && newHeight < 200) setFooterHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            isResizingSidebar.current = false;
            isResizingEditor.current = false;
            isResizingFooter.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isEditorVisible]);

    // Resize start handlers
    const startResizingSidebar = () => {
        isResizingSidebar.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const startResizingEditor = () => {
        isResizingEditor.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    };

    const startResizingFooter = () => {
        isResizingFooter.current = true;
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    };

    return {
        sidebarWidth,
        editorHeight,
        footerHeight,
        isEditorVisible,
        setIsEditorVisible,
        startResizingSidebar,
        startResizingEditor,
        startResizingFooter,
    };
}
