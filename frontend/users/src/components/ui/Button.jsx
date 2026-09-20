import React, { forwardRef } from 'react';
import { Play } from 'lucide-react';

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md',
  iconOnly = false,
  className = '', 
  onClick,
  tooltip,
  tooltipPosition = 'top',
  ...props 
}, ref) => {
  const baseClasses = "transition-all duration-300 focus:outline-none flex items-center justify-center gap-1.5 rounded-full whitespace-nowrap cursor-pointer";
  
  const variants = {
    primary: "bg-[#fa2d48] hover:bg-[#e0223e] text-white font-bold transform hover:scale-105 shadow-[0_8px_16px_rgba(250,45,72,0.3)]",
    secondary: "bg-transparent border border-neutral-500 text-white hover:border-white font-bold",
    white: "bg-white text-black font-bold transform hover:scale-105",
    dark: "bg-[#232323] hover:bg-[#2a2a2a] text-white font-medium",
    ghost: "bg-transparent hover:bg-[#1a1a1a] text-spotify-sub hover:text-white",
    glass: "bg-white/10 backdrop-blur-md text-white/70 shadow-md hover:bg-white/20 hover:text-white",
  };

  const sizes = {
    sm: iconOnly ? "w-8 h-8" : "h-9 px-4 text-sm",
    md: iconOnly ? "w-12 h-12" : "h-12 px-6 py-2 text-base",
    lg: iconOnly ? "w-14 h-14" : "h-14 px-10 py-4 text-lg",
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
      className={`${baseClasses} ${selectedVariant} ${selectedSize} ${className} ${tooltip ? 'group/btn relative' : ''}`} 
      onClick={onClick}
      {...props}
    >
      {/* Mặc định nút primary iconOnly không truyền children sẽ hiển thị nút Play */}
      {variant === 'primary' && iconOnly && !children ? (
        <Play size={size === 'lg' ? 28 : (size === 'md' ? 24 : 16)} fill="currentColor" strokeWidth={0} className="ml-1" />
      ) : (
        children
      )}

      {tooltip && (
        <span className={`absolute ${getTooltipPosition()} bg-[#282828] text-white text-xs font-normal px-2 py-1 rounded shadow-lg opacity-0 delay-0 group-hover/btn:opacity-100 group-hover/btn:delay-[2000ms] transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]`}>
          {tooltip}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
