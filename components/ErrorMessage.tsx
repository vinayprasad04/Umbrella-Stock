'use client';

interface ErrorMessageProps {
  message: string;
  title?: string;
}

export default function ErrorMessage({ message, title = "Something went wrong" }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <svg 
            className="h-12 w-12 text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-red-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-red-700 mb-4">
          {message}
        </p>
        
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Try Again
        </button>
        
        <p className="text-xs text-red-600 mt-3">
          If the problem persists, the market data service may be temporarily unavailable.
        </p>
      </div>
    </div>
  );
}