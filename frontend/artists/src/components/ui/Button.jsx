import React, { forwardRef } from 'react';
import { Play, Loader2 } from 'lucide-react';

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  iconOnly = false,
  isLoading = false,
  disabled = false,
  className = '', 
  onClick,
  tooltip,
  tooltipPosition = 'top',
  ...props 
}, ref) => {
  const baseClasses = "transition-all duration-200 focus:outline-none flex items-center justify-center gap-2 rounded-full whitespace-nowrap cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[#fa2d48] hover:bg-[#e0223e] text-white font-bold transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_16px_rgba(250,45,72,0.3)]",
    secondary: "bg-transparent border border-neutral-600 text-white hover:border-white font-semibold hover:bg-white/5",
    white: "bg-white text-black font-bold transform hover:scale-[1.02] active:scale-[0.98] hover:bg-neutral-200",
    dark: "bg-[#232323] hover:bg-[#2a2a2a] text-white font-medium",
    danger: "bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-[0_4px_12px_rgba(225,29,72,0.3)]",
    ghost: "bg-transparent hover:bg-white/10 text-spotify-sub hover:text-white",
    glass: "bg-white/10 backdrop-blur-md text-white/90 shadow-md hover:bg-white/20 hover:text-white",
  };

  const sizes = {
    sm: iconOnly ? "w-8 h-8" : "h-9 px-4 text-xs font-semibold",
    md: iconOnly ? "w-11 h-11" : "h-11 px-6 py-2 text-sm font-bold",
    lg: iconOnly ? "w-14 h-14" : "h-14 px-8 py-3.5 text-base font-bold",
  };

  const selectedVariant = variants[variant] || variants.primary;
  const selectedSize = sizes[size] || sizes.md;

  const getTooltipPosition = () => {
    switch (tooltipPosition) {
      case 'bottom': return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'bottom-left': return 'top-full mt-2 left-0';
      case 'bottom-right': return 'top-full mt-2 right-0';
      case 'left': return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right': return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top-left': return 'bottom-full mb-2 left-0';
      case 'top-right': return 'bottom-full mb-2 right-0';
      case 'top': default: return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <button 
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${selectedVariant} ${selectedSize} ${className} ${tooltip ? 'group/btn relative' : ''}`} 
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : variant === 'primary' && iconOnly && !children ? (
        <Play size={size === 'lg' ? 24 : size === 'md' ? 20 : 14} fill="currentColor" strokeWidth={0} className="ml-0.5" />
      ) : (
        children
      )}

      {tooltip && !disabled && (
        <span className={`absolute ${getTooltipPosition()} bg-[#282828] text-white text-xs font-normal px-2.5 py-1 rounded-md shadow-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999] border border-neutral-700`}>
          {tooltip}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
