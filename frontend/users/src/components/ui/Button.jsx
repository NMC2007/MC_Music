import React from 'react';
import { Play } from 'lucide-react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick, 
  ...props 
}) => {
  const baseClasses = "transition-all duration-300 font-bold focus:outline-none focus:ring-2 focus:ring-spotify-primary/50 flex items-center justify-center";
  
  const variants = {
    primary: "bg-spotify-primary hover:bg-spotify-primary-hover text-spotify-text py-3 px-8 rounded-full transform hover:scale-105",
    secondary: "bg-transparent border border-neutral-500 text-spotify-text hover:border-white py-2 px-6 rounded-full",
    play: "w-12 h-12 p-0 bg-spotify-primary rounded-full text-white hover:scale-105 shadow-[0_8px_16px_rgba(250,45,72,0.3)]",
    white: "bg-white text-black hover:scale-105 py-2 px-6 rounded-full transform",
  };

  const selectedClasses = variants[variant] || variants.primary;

  return (
    <button 
      className={`${baseClasses} ${selectedClasses} ${className}`} 
      onClick={onClick}
      {...props}
    >
      {variant === 'play' ? (children || <Play size={24} fill="currentColor" strokeWidth={0} />) : children}
    </button>
  );
};
