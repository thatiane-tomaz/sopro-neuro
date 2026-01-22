import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useIsNativeIOS = () => {
  const [isNativeIOS, setIsNativeIOS] = useState(false);

  useEffect(() => {
    // Check if running as native iOS app via Capacitor
    const isNative = Capacitor.isNativePlatform();
    const isIOS = Capacitor.getPlatform() === 'ios';
    setIsNativeIOS(isNative && isIOS);
  }, []);

  return isNativeIOS;
};
