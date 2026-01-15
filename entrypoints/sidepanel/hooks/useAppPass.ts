import { useCallback, useEffect, useRef, useState } from 'react';
import { activateAppPass, checkAppPass, manageAppPass } from '@chrome-stats/app-pass-sdk';

export type AppPassStatus = 'unknown' | 'active' | 'inactive' | 'error';

type AppPassState = {
  status: AppPassStatus;
  message: string | null;
};

export const useAppPass = () => {
  const [status, setStatus] = useState<AppPassStatus>('unknown');
  const [message, setMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const activateInFlightRef = useRef(false);

  const checkStatus = useCallback(async (): Promise<AppPassState> => {
    setIsChecking(true);
    try {
      const response = await checkAppPass();
      if (response.status === 'ok') {
        setStatus('active');
        setMessage(null);
        return { status: 'active', message: null };
      }
      const nextMessage = response.message ?? null;
      setStatus('inactive');
      setMessage(nextMessage);
      return { status: 'inactive', message: nextMessage };
    } catch (error) {
      console.error(error);
      const nextMessage = 'App Pass check failed.';
      setStatus('error');
      setMessage(nextMessage);
      return { status: 'error', message: nextMessage };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const activate = useCallback(async () => {
    if (activateInFlightRef.current) {
      return null;
    }
    setIsActivating(true);
    activateInFlightRef.current = true;
    try {
      return await activateAppPass();
    } finally {
      activateInFlightRef.current = false;
      setIsActivating(false);
    }
  }, []);

  const manage = useCallback(async () => manageAppPass(), []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    message,
    isChecking,
    isActivating,
    checkStatus,
    activate,
    manage,
  };
};
