import { useEffect, useState } from 'react';

export const useExamIntegrity = () => {
  const [warningsCount, setWarningsCount] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [lastViolation, setLastViolation] = useState<string | null>(null);

  useEffect(() => {
    const triggerWarning = (reason: string) => {
      setWarningsCount(prev => prev + 1);
      setLastViolation(reason);
      setIsWarningVisible(true);
      // In a real system, we'd log this to the backend here
      console.warn(`Integrity Violation: ${reason}`);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) triggerWarning("Tab switch detected");
    };

    const handleWindowBlur = () => triggerWarning("Focus lost (Window blurred)");

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerWarning("Context menu (Right click) is disabled");
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerWarning("Copy/Paste is disabled");
    };

    const handleFullScreenExit = () => {
      if (!document.fullscreenElement) {
        triggerWarning("Fullscreen mode exited");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('fullscreenchange', handleFullScreenExit);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('fullscreenchange', handleFullScreenExit);
    };
  }, []);

  const dismissWarning = () => setIsWarningVisible(false);

  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    }
  };

  return { warningsCount, isWarningVisible, lastViolation, dismissWarning, requestFullscreen };
};
