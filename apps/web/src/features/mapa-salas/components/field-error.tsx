/** Mensaje de validación bajo un campo. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs font-medium text-danger">{message}</span>;
}
