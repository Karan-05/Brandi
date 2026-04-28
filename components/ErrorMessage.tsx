type ErrorMessageProps = {
  message: string;
};

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      aria-live="polite"
      className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5"
      role="alert"
    >
      <WarningIcon />
      <p className="text-sm leading-6 text-rose-900">{message}</p>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 2L14.5 13.5H1.5L8 2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 6.5V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
