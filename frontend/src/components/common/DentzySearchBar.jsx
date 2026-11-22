import React from 'react';
import { Icons as Ico } from './DashboardIcons';
import './DentzySearchBar.css';

/**
 * DentzySearchBar — Universal, outline-free search bar across all dashboards.
 * Ponytail: Native input, seamless container, zero focus ring/box outline.
 *
 * @param {object} props
 * @param {string} props.value - Search query value
 * @param {function} props.onChange - Handler called on text change
 * @param {function} [props.onClear] - Optional clear handler (defaults to onChange({ target: { value: '' } }))
 * @param {string} [props.placeholder='Search...'] - Placeholder label
 * @param {string} [props.className=''] - Extra wrapper classes
 * @param {object} [props.style={}] - Style overrides on the wrapper container
 * @param {object} [props.inputStyle={}] - Style overrides on the inner input
 */
export default function DentzySearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  style = {},
  inputStyle = {},
  autoFocus = false,
  disabled = false,
  onKeyDown,
  ...rest
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`dz-search-bar ${className}`.trim()} style={style}>
      <span className="dz-search-icon">{Ico.search(14)}</span>
      <input
        type="text"
        className="dz-search-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        onKeyDown={onKeyDown}
        style={inputStyle}
        {...rest}
      />
      {Boolean(value) && (
        <button
          type="button"
          onClick={handleClear}
          className="dz-search-clear"
          title="Clear search"
          aria-label="Clear search"
        >
          {Ico.x(12)}
        </button>
      )}
    </div>
  );
}
