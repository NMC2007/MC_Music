import React, { forwardRef } from "react";

/**
 * FormField: Bọc nhãn (Label), lỗi validation và các gợi ý nhập liệu
 */
export const FormField = ({ label, error, required = false, children, className = "" }) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-neutral-300">
          {label} {required && <span className="text-[#fa2d48]">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-rose-400 font-medium animate-in fade-in duration-150">
          {error}
        </p>
      )}
    </div>
  );
};

export { Input } from "./Input";

/**
 * Textarea: Ô nhập văn bản nhiều dòng
 */
export const Textarea = forwardRef(({ error, className = "", rows = 4, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`w-full bg-[#242424] hover:bg-[#282828] focus:bg-[#282828] text-white placeholder-neutral-500 text-sm rounded-xl px-4 py-3 outline-none border transition-all duration-200 resize-none scrollbar-thin ${
        error
          ? "border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          : "border-neutral-700/60 focus:border-white/80 focus:ring-1 focus:ring-white/40"
      } ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export default FormField;
