// src/components/ui/input.jsx
export function Input({ type = 'text', value, onChange, placeholder, className = '' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-3 py-2 border rounded ${className}`}
    />
  );
}
