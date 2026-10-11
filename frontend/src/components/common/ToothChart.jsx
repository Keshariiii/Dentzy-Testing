'use client';
import React from 'react';
import './ToothChart.css';

/**
 * 4-Quadrant Tooth Chart (1–8 per quadrant)
 * Standard Dental Anatomy (Palmer/Quadrant notation with Left/Right orientation)
 *
 * UR: [8, 7, 6, 5, 4, 3, 2, 1]  |  UL: [1, 2, 3, 4, 5, 6, 7, 8]
 * LR: [8, 7, 6, 5, 4, 3, 2, 1]  |  LL: [1, 2, 3, 4, 5, 6, 7, 8]
 */

const QUAD_UR = [8, 7, 6, 5, 4, 3, 2, 1];
const QUAD_UL = [1, 2, 3, 4, 5, 6, 7, 8];
const QUAD_LR = [8, 7, 6, 5, 4, 3, 2, 1];
const QUAD_LL = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ToothChart({ selectedTeeth = [], onChange }) {
  const isSelected = (quad, tooth) => selectedTeeth.includes(`${quad}${tooth}`);

  const toggleTooth = (quad, tooth) => {
    const code = `${quad}${tooth}`;
    const next = selectedTeeth.includes(code)
      ? selectedTeeth.filter(t => t !== code)
      : [...selectedTeeth, code];
    onChange?.(next);
  };

  const selectUpper = () => {
    const upper = [
      ...QUAD_UR.map(n => `UR${n}`),
      ...QUAD_UL.map(n => `UL${n}`),
    ];
    const allUpperSelected = upper.every(t => selectedTeeth.includes(t));
    const next = allUpperSelected
      ? selectedTeeth.filter(t => !upper.includes(t))
      : Array.from(new Set([...selectedTeeth, ...upper]));
    onChange?.(next);
  };

  const selectLower = () => {
    const lower = [
      ...QUAD_LR.map(n => `LR${n}`),
      ...QUAD_LL.map(n => `LL${n}`),
    ];
    const allLowerSelected = lower.every(t => selectedTeeth.includes(t));
    const next = allLowerSelected
      ? selectedTeeth.filter(t => !lower.includes(t))
      : Array.from(new Set([...selectedTeeth, ...lower]));
    onChange?.(next);
  };

  const clearAll = () => {
    onChange?.([]);
  };

  return (
    <div className="tc-container">
      {/* Directional Header: Patient's Right on viewer's Left, Patient's Left on viewer's Right */}
      <div className="tc-header">
        <div className="tc-dir tc-dir-right">
          <span className="tc-arrow">◄</span> RIGHT (R) <span className="tc-patient-note">Patient</span>
        </div>
        <div className="tc-arch-tag">Maxillary (Upper)</div>
        <div className="tc-dir tc-dir-left">
          <span className="tc-patient-note">Patient</span> LEFT (L) <span className="tc-arrow">►</span>
        </div>
      </div>

      {/* Crosshair Chart Grid */}
      <div className="tc-grid">
        {/* Upper Row */}
        <div className="tc-row tc-row-upper">
          {/* UR: 8 to 1 */}
          <div className="tc-quad tc-quad-ur">
            <span className="tc-quad-badge">UR</span>
            <div className="tc-btn-group">
              {QUAD_UR.map(num => {
                const active = isSelected('UR', num);
                return (
                  <button
                    type="button"
                    key={`UR${num}`}
                    className={`tc-tooth-btn ${active ? 'tc-tooth-btn--active' : ''}`}
                    onClick={() => toggleTooth('UR', num)}
                    title={`Upper Right ${num}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tc-v-divider" />

          {/* UL: 1 to 8 */}
          <div className="tc-quad tc-quad-ul">
            <span className="tc-quad-badge">UL</span>
            <div className="tc-btn-group">
              {QUAD_UL.map(num => {
                const active = isSelected('UL', num);
                return (
                  <button
                    type="button"
                    key={`UL${num}`}
                    className={`tc-tooth-btn ${active ? 'tc-tooth-btn--active' : ''}`}
                    onClick={() => toggleTooth('UL', num)}
                    title={`Upper Left ${num}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Horizontal midline separator */}
        <div className="tc-h-divider" />

        {/* Lower Row */}
        <div className="tc-row tc-row-lower">
          {/* LR: 8 to 1 */}
          <div className="tc-quad tc-quad-lr">
            <span className="tc-quad-badge">LR</span>
            <div className="tc-btn-group">
              {QUAD_LR.map(num => {
                const active = isSelected('LR', num);
                return (
                  <button
                    type="button"
                    key={`LR${num}`}
                    className={`tc-tooth-btn ${active ? 'tc-tooth-btn--active' : ''}`}
                    onClick={() => toggleTooth('LR', num)}
                    title={`Lower Right ${num}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tc-v-divider" />

          {/* LL: 1 to 8 */}
          <div className="tc-quad tc-quad-ll">
            <span className="tc-quad-badge">LL</span>
            <div className="tc-btn-group">
              {QUAD_LL.map(num => {
                const active = isSelected('LL', num);
                return (
                  <button
                    type="button"
                    key={`LL${num}`}
                    className={`tc-tooth-btn ${active ? 'tc-tooth-btn--active' : ''}`}
                    onClick={() => toggleTooth('LL', num)}
                    title={`Lower Left ${num}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="tc-footer-label">Mandibular (Lower)</div>

      {/* Quick Action Controls */}
      <div className="tc-actions">
        <button type="button" className="tc-quick-btn" onClick={selectUpper}>
          Upper Arch
        </button>
        <button type="button" className="tc-quick-btn" onClick={selectLower}>
          Lower Arch
        </button>
        {selectedTeeth.length > 0 && (
          <button type="button" className="tc-quick-btn tc-quick-btn--clear" onClick={clearAll}>
            Clear
          </button>
        )}
      </div>

      {/* Selected Summary Pill */}
      <div className="tc-summary">
        {selectedTeeth.length > 0 ? (
          <div className="tc-summary-badge">
            <span className="tc-summary-count">{selectedTeeth.length} teeth:</span>
            <span className="tc-summary-list">{selectedTeeth.join(', ')}</span>
          </div>
        ) : (
          <span className="tc-summary-hint">Click teeth numbers (1–8) to select</span>
        )}
      </div>
    </div>
  );
}
