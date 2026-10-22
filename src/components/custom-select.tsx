"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
  subtitle?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option…",
  disabled = false,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${disabled ? "is-disabled" : ""} ${className}`}
    >
      {label && <span className="custom-select-label">{label}</span>}

      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "is-open" : ""}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-value">
          {selectedOption?.icon && (
            <span className="custom-select-value-icon">{selectedOption.icon}</span>
          )}
          <span className="custom-select-value-text">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        {/* Custom Animated Rotating Chevron */}
        <span className={`custom-select-chevron ${isOpen ? "is-rotated" : ""}`} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="custom-select-dropdown" role="listbox">
          <div className="custom-select-options">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`custom-select-option ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <div className="custom-select-option-content">
                    {option.icon && (
                      <span className="custom-select-option-icon">{option.icon}</span>
                    )}
                    <span className="custom-select-option-label">{option.label}</span>
                    {option.subtitle && (
                      <span className="custom-select-option-sub">{option.subtitle}</span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="custom-select-check" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
