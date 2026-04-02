'use client';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message = '처리중...', fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

interface ButtonLoadingProps {
  children: React.ReactNode;
  loading: boolean;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
}

export function ButtonLoading({ 
  children, 
  loading, 
  loadingText = '처리중...', 
  className = '',
  disabled = false 
}: ButtonLoadingProps) {
  return (
    <button 
      type="submit" 
      disabled={loading || disabled}
      className={`${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {loadingText}
        </span>
      ) : children}
    </button>
  );
}
