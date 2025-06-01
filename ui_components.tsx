
import React, { ReactNode, useState } from 'react';
import { PlusIcon, EditIcon, TrashIcon } from '@/constants'; // Assuming icons are here
import { Theme, Vehicle, VehicleStatus, VehicleType } from '@/types';
import { useTheme } from '@/App'; // For theme-specific styles if needed

// Card Component
interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
  onClick?: () => void;
  hoverEffect?: boolean; // New prop for hover animation
  id?: string; // Allow assigning an ID to the card
}
export const Card: React.FC<CardProps> = ({ children, className = '', title, actions, onClick, hoverEffect = false, id }) => {
  return (
    <div 
      id={id} // Pass id to the div
      className={`bg-light_surface dark:bg-dark_surface shadow-lg rounded-xl p-6 ${className} 
                 ${onClick ? 'cursor-pointer' : ''}
                 ${hoverEffect ? 'transition-all duration-200 ease-in-out hover:shadow-xl hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      {title && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-light_text_primary dark:text-dark_text_primary">{title}</h3>
          {actions && <div className="flex space-x-2 items-center">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xs'; // Added xs
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles = "font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-150 ease-in-out inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary-light disabled:bg-primary/70',
    secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 disabled:bg-red-400/70',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 disabled:bg-yellow-400/70',
    ghost: 'bg-transparent text-primary hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary/20 focus:ring-primary/50'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {leftIcon && <span className={`mr-2 ${size === 'xs' || size === 'sm' ? 'mr-1' : ''}`}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={`ml-2 ${size === 'xs' || size === 'sm' ? 'ml-1' : ''}`}>{rightIcon}</span>}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}
export const Input: React.FC<InputProps> = ({ label, id, error, className, wrapperClassName, ...props }) => {
  const { theme } = useTheme();
  const baseInputClasses = `w-full px-3 py-2 border rounded-md bg-transparent
    focus:outline-none focus:ring-2 transition-colors duration-150`;
  
  const themeInputClasses = theme === Theme.Dark
    ? `border-slate-600 hover:border-slate-500 focus:ring-primary focus:border-primary text-dark_text_primary placeholder-slate-500`
    : `border-slate-300 hover:border-slate-400 focus:ring-primary focus:border-primary text-light_text_primary placeholder-slate-400`;

  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

  return (
    <div className={`${wrapperClassName || 'mb-1'}`}> {/* Changed default wrapper margin */}
      {label && <label htmlFor={id} className="block text-sm font-medium text-light_text_secondary dark:text-dark_text_secondary mb-1">{label}</label>}
      <input id={id} className={`${baseInputClasses} ${themeInputClasses} ${errorClasses} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, wrapperClassName, ...props }) => {
  const { theme } = useTheme();
  const baseTextareaClasses = `w-full px-3 py-2 border rounded-md bg-transparent
    focus:outline-none focus:ring-2 transition-colors duration-150`;
  
  const themeTextareaClasses = theme === Theme.Dark
    ? `border-slate-600 hover:border-slate-500 focus:ring-primary focus:border-primary text-dark_text_primary placeholder-slate-500`
    : `border-slate-300 hover:border-slate-400 focus:ring-primary focus:border-primary text-light_text_primary placeholder-slate-400`;

  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

  return (
    <div className={`${wrapperClassName || 'mb-1'}`}> {/* Changed default wrapper margin */}
      {label && <label htmlFor={id} className="block text-sm font-medium text-light_text_secondary dark:text-dark_text_secondary mb-1">{label}</label>}
      <textarea id={id} className={`${baseTextareaClasses} ${themeTextareaClasses} ${errorClasses} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};


// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  wrapperClassName?: string;
}
export const Select: React.FC<SelectProps> = ({ label, id, error, options, className, wrapperClassName, ...props }) => {
  const { theme } = useTheme();
  const baseSelectClasses = `w-full px-3 py-2 border rounded-md bg-transparent 
    focus:outline-none focus:ring-2 transition-colors duration-150 appearance-none`;
  
  const themeSelectClasses = theme === Theme.Dark
    ? `border-slate-600 hover:border-slate-500 focus:ring-primary focus:border-primary text-dark_text_primary placeholder-slate-500`
    : `border-slate-300 hover:border-slate-400 focus:ring-primary focus:border-primary text-light_text_primary placeholder-slate-400`;
  
  const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

  return (
    <div className={`relative ${wrapperClassName || 'mb-1'}`}> {/* Changed default wrapper margin */}
      {label && <label htmlFor={id} className="block text-sm font-medium text-light_text_secondary dark:text-dark_text_secondary mb-1">{label}</label>}
      <select id={id} className={`${baseSelectClasses} ${themeSelectClasses} ${errorClasses} ${className}`} {...props}>
        <option value="" disabled className="text-slate-500">Selecione...</option>
        {options.map(option => (
          <option key={option.value} value={option.value} className="bg-light_surface dark:bg-dark_surface text-light_text_primary dark:text-dark_text_primary">
            {option.label}
          </option>
        ))}
      </select>
      <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${label ? 'pt-6' : ''} text-light_text_secondary dark:text-dark_text_secondary`}>
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};


// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  contentClassName?: string;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'lg', contentClassName }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div 
        className={`bg-light_surface dark:bg-dark_surface rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95 animate-modal-appear`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 px-6 pt-6"> {/* Added padding to header */}
          <h3 className="text-xl font-semibold text-light_text_primary dark:text-dark_text_primary">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full text-light_text_secondary dark:text-dark_text_secondary hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className={`flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent ${contentClassName || 'p-6'}`}> {/* Default padding if not overridden */}
          {children}
        </div>
        {footer && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3 flex-shrink-0 px-6 pb-6"> {/* Added padding to footer */}
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// DetailsViewModal Component
export interface DetailItem<T> {
  key: keyof T | string; // Allow string for custom keys not directly in T
  label: string;
  render?: (value: any, item: T) => ReactNode;
  isFullWidth?: boolean;
  className?: string;
}

interface DetailsViewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemData: T | null;
  displayConfig: DetailItem<T>[];
  onEdit?: (item: T) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const DetailsViewModal = <T extends Record<string, any>>(
  { isOpen, onClose, title, itemData, displayConfig, onEdit, size = '3xl' }: DetailsViewModalProps<T>
) => {
  if (!isOpen || !itemData) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size} contentClassName="p-6"
      footer={
        <div className="flex justify-between w-full items-center">
            <div>{/* Can add other actions here later */}</div>
            <div className="flex space-x-3">
                <Button variant="secondary" onClick={onClose}>Fechar</Button>
                {onEdit && (
                <Button variant="primary" onClick={() => onEdit(itemData)} leftIcon={<EditIcon className="w-4 h-4"/>}>
                    Editar
                </Button>
                )}
            </div>
        </div>
      }
    >
      <div className="space-y-3">
        {displayConfig.map(config => {
          const value = config.key.toString().includes('.') 
            ? config.key.toString().split('.').reduce((o, i) => o?.[i], itemData) // Basic deep-key access
            : itemData[config.key as keyof T];

          return (
            <div 
                key={String(config.key)} 
                className={`py-2 px-1 ${config.isFullWidth ? 'block' : 'grid grid-cols-1 md:grid-cols-3 gap-2 items-start'} border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${config.className || ''}`}
            >
              <dt className={`text-sm font-medium text-light_text_secondary dark:text-dark_text_secondary ${config.isFullWidth ? 'mb-1' : 'md:col-span-1'}`}>{config.label}:</dt>
              <dd className={`text-sm text-light_text_primary dark:text-dark_text_primary ${config.isFullWidth ? '' : 'md:col-span-2'} break-words`}>
                {config.render ? config.render(value, itemData) : (value === undefined || value === null || value === '') ? <span className="italic text-slate-500">N/A</span> : String(value)}
              </dd>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};


// Table Component
export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  render?: (item: T) => ReactNode; 
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  customActions?: (item: T) => ReactNode;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  highlightRowOnHover?: boolean; // Default true, set to false to disable
  rowClassName?: string | ((item: T) => string);
}

export const Table = <T extends { id: string | number }>( 
  { columns, data, onEdit, onDelete, customActions, isLoading, onRowClick, highlightRowOnHover = true, rowClassName }: TableProps<T>
) => {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <Spinner size="lg"/>
        <p className="text-light_text_secondary dark:text-dark_text_secondary">Carregando dados...</p>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
     return <p className="text-center py-10 text-light_text_secondary dark:text-dark_text_secondary italic">Nenhum dado encontrado.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
      <table className="w-full min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider 
                            ${theme === Theme.Dark ? 'text-dark_text_secondary' : 'text-light_text_secondary'} 
                            ${col.headerClassName || ''} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
            {(onEdit || onDelete || customActions) && (
              <th scope="col" className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider 
                                          ${theme === Theme.Dark ? 'text-dark_text_secondary' : 'text-light_text_secondary'}`}>
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-light_surface dark:bg-dark_surface divide-y divide-slate-200 dark:divide-slate-700">
          {data.map((item) => (
            <tr 
              key={item.id} 
              className={`${highlightRowOnHover ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60' : ''} 
                         ${onRowClick ? 'cursor-pointer' : ''} transition-colors duration-150
                         ${typeof rowClassName === 'function' ? rowClassName(item) : rowClassName || ''}`}
              onClick={(e) => {
                  // Prevent row click if the click target is inside a button or link within the row actions cell
                  const target = e.target as HTMLElement;
                  if (target.closest('button, a') && target.closest('[data-row-actions]')) {
                      return;
                  }
                  if (onRowClick) onRowClick(item);
              }}
            >
              {columns.map((col, index) => (
                <td key={index} className={`px-4 py-3 whitespace-nowrap text-sm 
                                          ${theme === Theme.Dark ? 'text-dark_text_primary' : 'text-light_text_primary'} 
                                          ${col.cellClassName || ''} ${col.className || ''}`}>
                  {col.render 
                    ? col.render(item) 
                    : typeof col.accessor === 'function' 
                    ? col.accessor(item) 
                    : String(item[col.accessor as keyof T] ?? '')}
                </td>
              ))}
              {(onEdit || onDelete || customActions) && (
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium" data-row-actions>
                  <div className="flex items-center justify-end space-x-1">
                    {customActions && customActions(item)}
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(item);}} aria-label="Editar" title="Editar">
                        <EditIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(item);}} className="text-red-500 hover:text-red-700 dark:hover:text-red-400" aria-label="Excluir" title="Excluir">
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


// Spinner Component
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', className?: string, color?: string }> = ({ size = 'md', className = '', color = 'border-primary' }) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 ${color} ${sizeClasses[size]} ${className}`}></div>
  );
};

// StatusBadge Component
interface StatusBadgeProps {
  text: string;
  colorClass: string; // Full Tailwind color class, e.g., 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300'
  icon?: ReactNode;
  dot?: boolean; // If true, shows a small dot instead of full background
  size?: 'xs' | 'sm';
}
export const StatusBadge: React.FC<StatusBadgeProps> = ({ text, colorClass, icon, dot = false, size = 'sm' }) => {
  const baseStyle = `font-semibold rounded-full inline-flex items-center`;
  const sizeStyle = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[0.6rem]'; // smaller for xs
  const dotStyle = `w-2 h-2 rounded-full mr-1.5 flex-shrink-0`;

  if (dot) {
    const dotColor = colorClass.match(/bg-([a-z]+)-(\d+)/)?.[0] || 'bg-slate-500'; // Extract bg color for dot
    return (
      <span className={`${baseStyle} ${colorClass.replace(/bg-\w+-\d+/, '')} ${colorClass.replace(/dark:bg-\w+\/\d+/, '')}  py-0.5 text-xs`}>
        <span className={`${dotStyle} ${dotColor}`}></span>
        {text}
      </span>
    );
  }

  return (
    <span className={`${baseStyle} ${sizeStyle} ${colorClass}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {text}
    </span>
  );
};