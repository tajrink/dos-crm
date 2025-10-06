import { useState, useCallback, useRef } from 'react';
import { ErrorHandler } from '../utils/errorHandler';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: unknown) => void;
  onMaxAttemptsReached?: (error: unknown) => void;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  lastError: unknown;
}

export const useRetry = (options: RetryOptions = {}) => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    onMaxAttemptsReached,
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    lastError: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDelay = useCallback(
    (attempt: number): number => {
      const delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
      return Math.min(delay, maxDelay);
    },
    [initialDelay, backoffFactor, maxDelay]
  );

  const executeWithRetry = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      let currentAttempt = 0;
      let lastError: any;

      while (currentAttempt < maxAttempts) {
        currentAttempt++;
        
        setRetryState({
          isRetrying: currentAttempt > 1,
          attempt: currentAttempt,
          lastError: null,
        });

        try {
          const result = await operation();
          
          // Reset state on success
          setRetryState({
            isRetrying: false,
            attempt: 0,
            lastError: null,
          });
          
          return result;
        } catch (error) {
          lastError = error;
          
          setRetryState({
            isRetrying: true,
            attempt: currentAttempt,
            lastError: error,
          });

          // Check if we should retry
          if (currentAttempt >= maxAttempts || !ErrorHandler.shouldRetry(error, currentAttempt, maxAttempts)) {
            break;
          }

          // Call retry callback
          if (onRetry) {
            onRetry(currentAttempt, error);
          }

          // Wait before retrying
          const delay = calculateDelay(currentAttempt);
          await new Promise((resolve) => {
            timeoutRef.current = setTimeout(resolve, delay);
          });
        }
      }

      // Max attempts reached or non-retryable error
      setRetryState({
        isRetrying: false,
        attempt: currentAttempt,
        lastError,
      });

      if (onMaxAttemptsReached) {
        onMaxAttemptsReached(lastError);
      }

      throw lastError;
    },
    [maxAttempts, calculateDelay, onRetry, onMaxAttemptsReached]
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setRetryState({
      isRetrying: false,
      attempt: 0,
      lastError: null,
    });
  }, []);

  const manualRetry = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      reset();
      return executeWithRetry(operation);
    },
    [executeWithRetry, reset]
  );

  return {
    executeWithRetry,
    manualRetry,
    reset,
    ...retryState,
  };
};

// Specialized retry hook for API calls
export const useApiRetry = () => {
  return useRetry({
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
    onRetry: (attempt, error) => {
      console.log(`API retry attempt ${attempt}:`, error);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max API retry attempts reached:', error);
      ErrorHandler.showError(error, 'API Request');
    },
  });
};

// Specialized retry hook for file operations
export const useFileRetry = () => {
  return useRetry({
    maxAttempts: 2,
    initialDelay: 500,
    maxDelay: 2000,
    backoffFactor: 2,
    onRetry: (attempt, error) => {
      console.log(`File operation retry attempt ${attempt}:`, error);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max file operation retry attempts reached:', error);
      ErrorHandler.showError(error, 'File Operation');
    },
  });
};

// Specialized retry hook for network operations
export const useNetworkRetry = () => {
  return useRetry({
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 1.5,
    onRetry: (attempt, error) => {
      console.log(`Network retry attempt ${attempt}:`, error);
      ErrorHandler.showWarning(`Connection issue. Retrying... (${attempt}/5)`);
    },
    onMaxAttemptsReached: (error) => {
      console.error('Max network retry attempts reached:', error);
      ErrorHandler.showError(error, 'Network Connection');
    },
  });
};