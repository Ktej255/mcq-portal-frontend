import { useEffect, useState } from 'react';

export const useExamIntegrity = () => {
  const [warningsCount, setWarningsCount] = useState(0);
  const [isWarningVisible, setIsWarningVisible] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningsCount(prev => prev + 1);
        setIsWarningVisible(true);
      }
    };

    const handleWindowBlur = () => {
      setWarningsCount(prev => prev + 1);
      setIsWarningVisible(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  const dismissWarning = () => setIsWarningVisible(false);

  return { warningsCount, isWarningVisible, dismissWarning };
};
