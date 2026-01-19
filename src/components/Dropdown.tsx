'use client';

import { useState, useRef, useEffect, ReactNode, createContext, useContext } from 'react';

const DropdownContext = createContext<{ closeDropdown: () => void } | null>(null);

export const useDropdown = () => {
  const context = useContext(DropdownContext);
  return context;
};

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  width?: string;
  className?: string;
}

export default function Dropdown({
  trigger,
  children,
  align = 'right',
  width = 'w-56',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClass = align === 'left' ? 'left-0' : 'right-0';

  const closeDropdown = () => setIsOpen(false);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <DropdownContext.Provider value={{ closeDropdown }}>
          <div
            className={`absolute ${alignmentClass} mt-2 ${width} bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200`}
          >
            {children}
          </div>
        </DropdownContext.Provider>
      )}
    </div>
  );
}

// Dropdown Item Component
interface DropdownItemProps {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  className?: string;
}

export function DropdownItem({
  icon,
  children,
  onClick,
  variant = 'default',
  className = '',
}: DropdownItemProps) {
  const dropdown = useDropdown();
  
  const variantClasses = {
    default: 'text-gray-700 hover:bg-gray-100',
    danger: 'text-red-600 hover:bg-red-50',
  };

  const handleClick = () => {
    onClick?.();
    dropdown?.closeDropdown();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// Dropdown Divider Component
export function DropdownDivider() {
  return <div className="border-t border-gray-100 my-2" />;
}

// Dropdown Header Component
interface DropdownHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DropdownHeader({ children, className = '' }: DropdownHeaderProps) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}
