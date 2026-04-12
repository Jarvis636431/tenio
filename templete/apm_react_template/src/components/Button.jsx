import React from 'react';
import './Button.css';

/**
 * Button 组件
 * @param {string} variant - 按钮类型: 'primary' | 'secondary' | 'text' | 'status'
 * @param {string} size - 按钮大小: 'sm' | 'md' | 'lg'
 * @param {string} status - 状态类型 (仅当 variant='status'): 'active' | 'done' | 'pending'
 * @param {boolean} disabled - 禁用状态
 * @param {ReactNode} children - 按钮内容
 * @param {function} onClick - 点击回调
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  status,
  disabled = false,
  children,
  onClick,
  className = '',
  ...props
}) => {
  const buttonClass = `btn btn-${variant} btn-${size} ${disabled ? 'btn-disabled' : ''} ${className}`;
  
  if (variant === 'status') {
    return (
      <span className={`btn-status btn-status-${status}`}>
        {children}
      </span>
    );
  }

  return (
    <button
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
