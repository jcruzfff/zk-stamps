import React, { ReactNode } from 'react';

interface CardSectionProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

const CardSection = ({ title, className, children }: CardSectionProps) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${className || ''}`}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  );
};

export default CardSection; 