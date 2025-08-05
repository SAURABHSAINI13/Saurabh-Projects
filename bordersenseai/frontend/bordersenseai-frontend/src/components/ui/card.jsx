import React from 'react';
import PropTypes from 'prop-types';
import './card.css'; // Optional if you want to add custom styles

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl shadow-md bg-white p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 border-b pb-2 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h2 className={`text-xl font-bold text-gray-800 ${className}`}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

// Optional: define PropTypes
Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

CardHeader.propTypes = Card.propTypes;
CardTitle.propTypes = Card.propTypes;
CardContent.propTypes = Card.propTypes;
