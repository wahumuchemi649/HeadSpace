import { useState, useEffect, useMemo, useRef } from 'react';
import './PhoneInput.css';
import { COUNTRY_CODES } from '../utils/countryCodes';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';

export default function PhoneInput({
  countryCode = '+254',
  onCountryChange,
  value = '',
  onChange,
  onBlur,
  name = 'phoneNumber',
  id = 'phoneNumber',
  placeholder,
  required = false,
  disabled = false,
  hasError = false,
  className = '',
  autoFocus = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Match selected country by code or default to Kenya (KE)
  const [selectedIso, setSelectedIso] = useState(() => {
    const match = COUNTRY_CODES.find((c) => c.code === countryCode);
    return match ? match.iso : 'KE';
  });

  useEffect(() => {
    const current = COUNTRY_CODES.find((c) => c.iso === selectedIso);
    if (!current || current.code !== countryCode) {
      const match = COUNTRY_CODES.find((c) => c.code === countryCode);
      if (match) setSelectedIso(match.iso);
    }
  }, [countryCode, selectedIso]);

  const selectedCountry = useMemo(() => {
    return COUNTRY_CODES.find((c) => c.iso === selectedIso) || COUNTRY_CODES[0];
  }, [selectedIso]);

  const defaultPlaceholder = countryCode === '+254' ? '712 345 678' : 'Phone number';

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRY_CODES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRY_CODES.filter((c) => 
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.iso.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        phoneInputRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleCountrySelect = (country) => {
    setSelectedIso(country.iso);
    setIsOpen(false);
    setSearchQuery('');
    if (onCountryChange) {
      onCountryChange(country.code, country);
    }
    // Return focus to phone input so user can keep typing
    phoneInputRef.current?.focus();
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearchQuery('');
  };

  return (
    <div 
      ref={containerRef} 
      className={`intl-phone-wrapper ${hasError ? 'has-error' : ''} ${isOpen ? 'dropdown-open' : ''} ${className}`.trim()}
    >
      {/* Minimized Prefix Trigger: Strictly Flag + Code + Chevron (No double flags, no blocking) */}
      <button
        type="button"
        className="intl-phone-prefix-btn"
        onClick={toggleDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`${selectedCountry.name} (${selectedCountry.code}) - Click to switch country`}
      >
        <span className="intl-phone-flag" aria-hidden="true">{selectedCountry.flag}</span>
        <span className="intl-phone-code">{selectedCountry.code}</span>
        <FiChevronDown className={`intl-country-chevron ${isOpen ? 'rotated' : ''}`} aria-hidden="true" />
      </button>

      {/* Main Phone Number Text Input */}
      <input
        ref={phoneInputRef}
        type="tel"
        id={id}
        name={name}
        className="intl-phone-input"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder || defaultPlaceholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="tel-national"
      />

      {/* Floating Dropdown Popover (Zero conflict with any global CSS) */}
      {isOpen && (
        <div className="intl-country-popover" role="dialog" aria-label="Select Country">
          <div className="intl-popover-search-wrap">
            <FiSearch className="intl-search-icon" size={14} />
            <input
              ref={searchInputRef}
              type="text"
              className="intl-search-input"
              placeholder="Search country or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search countries"
            />
            {searchQuery && (
              <button
                type="button"
                className="intl-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          <div className="intl-country-list" role="listbox">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = c.iso === selectedIso;
                return (
                  <button
                    key={c.iso}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`intl-country-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleCountrySelect(c)}
                  >
                    <span className="intl-row-flag">{c.flag}</span>
                    <span className="intl-row-name">{c.name}</span>
                    <span className="intl-row-code">{c.code}</span>
                  </button>
                );
              })
            ) : (
              <div className="intl-no-results">No matching countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
