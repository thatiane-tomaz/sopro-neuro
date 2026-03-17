import { ReactNode } from 'react';
import { useErrorLogging } from '@/hooks/useErrorLogging';

export const ErrorLoggerProvider = ({ children }: { children: ReactNode }) => {
  useErrorLogging();
  return <>{children}</>;
};
