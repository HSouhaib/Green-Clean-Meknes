import { useState, useEffect } from 'react';

// Global login modal state using a custom event
const LOGIN_MODAL_EVENT = 'open-login-modal';

export function openLoginModal() {
  window.dispatchEvent(new CustomEvent(LOGIN_MODAL_EVENT));
}

export function useLoginModalTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener(LOGIN_MODAL_EVENT, handler);
    return () => window.removeEventListener(LOGIN_MODAL_EVENT, handler);
  }, []);

  return { isOpen, setIsOpen };
}
