import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

const ErrorMessage = ({ 
  message, 
  onRetry, 
  className, 
  variant = 'default' 
}: ErrorMessageProps) => {
  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm',
        className
      )}>
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;