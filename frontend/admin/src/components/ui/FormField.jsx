import React from "react";

/**
 * FormField: Bao bọc ô nhập liệu kèm Nhãn (Label), chỉ báo bắt buộc và thông báo lỗi
 */
export const FormField = ({
  label,
  required = false,
  error,
  helperText,
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-neutral-300 select-none">
          {label}
          {required && <span className="text-[#fa2d48] ml-1">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className="text-xs text-rose-400 font-medium animate-in fade-in duration-150">
          {typeof error === "string" ? error : error?.message}
        </p>
      ) : helperText ? (
        <p className="text-xs text-neutral-400">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormField;

