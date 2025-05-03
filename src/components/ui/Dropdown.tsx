import React from "react";
import { setIcon } from "obsidian";

// Define the Dropdown component props
interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string, option: string }>;
  placeholder?: string;
  showClearButton?: boolean;
}

// Define the Dropdown component
export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select option",
  showClearButton = true,
}) => {
  // Set icons when component mounts
  const removeIconRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (removeIconRef.current) {
      setIcon(removeIconRef.current, "circle-x");
    }
  });

  return (
    <div className="dropdown" style={{ display: "flex", alignItems: "center", padding: "0" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          color: value ? "" : "var(--text-muted)",
          textAlign: "center",
          boxShadow: "none",
          background: "none",
          border: "none",
          outline: "none",
          padding: "0 2em 0 0.4em",
        }}
      >
        {!value && <option value="" disabled hidden>{placeholder}</option>}
        {options.map((option, index) => {
          if (typeof option === 'string') {
            return (
              <option key={index} value={option}>
                {option}
              </option>
            );
          } else {
            return (
              <option key={index} value={option.value}>
                {option.option}
              </option>
            );
          }
        })}
      </select>
      {value && showClearButton && (
        <button
          onClick={() => onChange("")}
          style={{
            cursor: "pointer",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            outline: "none",
            boxShadow: "none",
            transform: "translateX(-8px)",
          }}
        >
          <div style={{display: "flex", alignItems: "center", justifyContent: "center"}} ref={removeIconRef}></div>
        </button>
      )}
    </div>
  );
};
