type ErrorMessageProps = {
  message: string;
};

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      aria-live="polite"
      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900"
      role="alert"
    >
      {message}
    </div>
  );
}
