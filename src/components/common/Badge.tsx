import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'neutral' | 'teal';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
    warning: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    error: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
    teal: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[6px] border text-[11px] font-medium tracking-wider uppercase leading-none ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
