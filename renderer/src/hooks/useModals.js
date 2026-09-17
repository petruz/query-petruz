import { useState } from 'react';

/**
 * Custom hook to manage modal and context menu state
 * Handles input modals, connection modal, about modal, and context menus
 */
export function useModals() {
    const [contextMenu, setContextMenu] = useState(null); // { x, y, node }
    const [modal, setModal] = useState(null); // { type: 'RENAME'|'ADD_FOLDER'|'ADD_QUERY', node?, parentNode? }
    const [connectionModal, setConnectionModal] = useState(false);
    const [aboutModal, setAboutModal] = useState(false);

    const handleNodeContextMenu = (e, node) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    };

    return {
        contextMenu,
        setContextMenu,
        modal,
        setModal,
        connectionModal,
        setConnectionModal,
        aboutModal,
        setAboutModal,
        handleNodeContextMenu,
    };
}
