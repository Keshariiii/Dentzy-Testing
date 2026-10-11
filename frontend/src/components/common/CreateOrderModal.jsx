'use client';
import React, { useState, useEffect, useMemo } from 'react';
import BaseModal from '../ui/BaseModal';
import ToothChart from './ToothChart';
import {
  FileText,
  Calendar,
  Check,
  AlertCircle,
  X,
  User,
  Layers,
  Clock,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import TwentyFirstIconButton from '../ui/twentyfirst-icon-button';
import { Icons as Ico } from './DashboardIcons';
import './CreateOrderModal.css';

/**
 * Official Dentzy Rate Card Catalog (from further plans.md §4.2)
 */
export const RATE_CARD = [
  // Ceramic
  { id: 'pfm', name: 'PFM (Porcelain Fused to Metal)', category: 'Ceramic', price: 750, metric: 'unit', serviceType: 'Crown' },
  { id: 'pfm_facing', name: 'PFM Facing', category: 'Ceramic', price: 650, metric: 'unit', serviceType: 'Crown' },
  { id: 'ceramobond', name: 'Ceramobond Full Crown Metal', category: 'Ceramic', price: 400, metric: 'unit', serviceType: 'Crown' },
  { id: 'white_metal', name: 'White Metal', category: 'Ceramic', price: 250, metric: 'unit', serviceType: 'Crown' },
  { id: 'white_metal_facing', name: 'White Metal Facing', category: 'Ceramic', price: 400, metric: 'unit', serviceType: 'Crown' },

  // Zirconia
  { id: 'zircon_zahn', name: 'Zircon Zahn Metal Free', category: 'Zirconia', price: 1800, metric: 'unit', serviceType: 'Crown' },

  // Acrylic
  { id: 'acrylic_jc', name: 'Acrylic J/C (heat cure)', category: 'Acrylic', price: 250, metric: 'unit', serviceType: 'Crown' },
  { id: 'acrylic_full_set', name: 'Acrylic Full Set', category: 'Acrylic', price: 1500, metric: 'set', serviceType: 'Denture' },
  { id: 'fibre_full_set', name: 'Fibre Full Set', category: 'Acrylic', price: 2000, metric: 'set', serviceType: 'Denture' },
  { id: 'indian_teeth_lucitone', name: 'Indian Teeth Lucitone Full Set', category: 'Acrylic', price: 3000, metric: 'set', serviceType: 'Denture' },
  { id: 'imported_teeth_lucitone', name: 'Imported Teeth Lucitone Full Set', category: 'Acrylic', price: 3500, metric: 'set', serviceType: 'Denture' },
  { id: 'rpd', name: 'R.P.D (Removable Partial Denture)', category: 'Acrylic', price: 350, metric: 'case', serviceType: 'Denture' },
  { id: 'denture_repair', name: 'Denture Repair', category: 'Acrylic', price: 300, metric: 'case', serviceType: 'Other' },
  { id: 'teeth_addition', name: 'Teeth Addition', category: 'Acrylic', price: 250, metric: 'clasp_case', serviceType: 'Other' },

  // Ortho & Aux
  { id: 'orthoplate', name: 'Orthoplate', category: 'Ortho & Aux', price: 800, metric: 'arch', serviceType: 'Other' },
  { id: 'bleaching_tray', name: 'Bleaching Tray U/L', category: 'Ortho & Aux', price: 800, metric: 'arch', serviceType: 'Other' },
  { id: 'night_guard', name: 'Night Guard U/L', category: 'Ortho & Aux', price: 1200, metric: 'arch', serviceType: 'Retainer' },
];

const CATEGORIES = ['Ceramic', 'Zirconia', 'Acrylic', 'Ortho & Aux'];
const RESTORATION_TYPES = ['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Retainer', 'Other'];
const PRIORITIES = ['Normal', 'High', 'Urgent', 'Low'];

export default function CreateOrderModal({
  isOpen,
  onClose,
  dentist,
  dentistList = [],
  onSubmitOrder,
  isSubmitting = false,
}) {
  const [selectedDentistId, setSelectedDentistId] = useState(dentist?._id || dentist?.id || '');
  const [patientName, setPatientName] = useState('');
  const [activeCategory, setActiveCategory] = useState('Ceramic');
  const [selectedProductId, setSelectedProductId] = useState('pfm');
  const [restorationType, setRestorationType] = useState('Crown');
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [selectedArches, setSelectedArches] = useState(['Upper']); // For set / arch metrics
  const [claspCount, setClaspCount] = useState(0); // For teeth addition
  const [priority, setPriority] = useState('Normal');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Auto price detector state with manual override latch
  const [manualAmount, setManualAmount] = useState('');
  const [isPriceOverridden, setIsPriceOverridden] = useState(false);

  // Sync dentist when prop changes
  useEffect(() => {
    if (dentist?._id || dentist?.id) {
      setSelectedDentistId(dentist._id || dentist.id);
    }
  }, [dentist]);

  // Current product info
  const currentProduct = useMemo(() => {
    return RATE_CARD.find(p => p.id === selectedProductId) || RATE_CARD[0];
  }, [selectedProductId]);

  // When category changes, default to first product of category
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    const firstInCat = RATE_CARD.find(p => p.category === cat);
    if (firstInCat) {
      setSelectedProductId(firstInCat.id);
      setRestorationType(firstInCat.serviceType);
      setIsPriceOverridden(false);
      setManualAmount('');
    }
  };

  // When product changes, sync restoration type if not custom
  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    const prod = RATE_CARD.find(p => p.id === prodId);
    if (prod) {
      setActiveCategory(prod.category);
      setRestorationType(prod.serviceType);
      setIsPriceOverridden(false);
      setManualAmount('');
    }
  };

  // Compute automated rate card price
  const autoAmount = useMemo(() => {
    if (!currentProduct) return 0;
    const { price, metric } = currentProduct;

    if (metric === 'unit') {
      const units = selectedTeeth.length > 0 ? selectedTeeth.length : 1;
      return price * units;
    }

    if (metric === 'set' || metric === 'arch') {
      const archCount = Math.max(1, selectedArches.length);
      return price * archCount;
    }

    if (metric === 'clasp_case') {
      return price + (Math.max(0, claspCount) * 100);
    }

    // Flat per case
    return price;
  }, [currentProduct, selectedTeeth, selectedArches, claspCount]);

  // Effective displayed amount
  const displayAmount = isPriceOverridden ? manualAmount : autoAmount;

  // Handle manual amount input
  const handleAmountChange = (e) => {
    const val = e.target.value;
    setManualAmount(val);
    setIsPriceOverridden(true);
  };

  const toggleArch = (arch) => {
    if (selectedArches.includes(arch)) {
      if (selectedArches.length > 1) {
        setSelectedArches(selectedArches.filter(a => a !== arch));
      }
    } else {
      setSelectedArches([...selectedArches, arch]);
    }
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    const dentistIdToUse = dentist?._id || dentist?.id || selectedDentistId;
    if (!dentistIdToUse) return;

    const finalAmount = Number(displayAmount) || 0;

    // Structured notes with clinical context
    let toothDetails = '';
    if (selectedTeeth.length > 0) {
      toothDetails = `Teeth: ${selectedTeeth.join(', ')}`;
    } else if (currentProduct.metric === 'set' || currentProduct.metric === 'arch') {
      toothDetails = `Arches: ${selectedArches.join(' & ')}`;
    }

    let notesSummary = `[Product: ${currentProduct.name}]`;
    if (toothDetails) notesSummary += ` [${toothDetails}]`;
    if (claspCount > 0) notesSummary += ` [Clasps: ${claspCount}]`;
    if (notes.trim()) notesSummary += ` | Notes: ${notes.trim()}`;

    const payload = {
      dentistId: dentistIdToUse,
      patientName: patientName.trim(),
      serviceType: restorationType, // Crown, Bridge, Denture, etc.
      priority,
      dueDate: dueDate || null,
      amount: finalAmount,
      notes: notesSummary,
      teethData: selectedTeeth,
      productId: currentProduct.id,
      autoCalculatedAmount: autoAmount,
      isPriceOverridden: isPriceOverridden ? 1 : 0,
    };

    if (onSubmitOrder) {
      await onSubmitOrder(payload);
    }
  };

  if (!isOpen) return null;

  const currentDentistName = dentist?.name || dentistList.find(d => (d._id || d.id) === selectedDentistId)?.name || 'Dentist';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      className="com-modal-wrap"
      raw={true}
      id="create-lab-order-modal"
    >
      <div className="com-modal-content">
        {/* Header */}
        <div className="com-header">
          <div className="com-header-info">
            <span className="com-badge-tag">New Lab Case</span>
            <h2 className="com-title">Create Lab Order</h2>
            <p className="com-subtitle">
              Dentist: <strong className="com-dentist-name">{currentDentistName}</strong>
              {dentist?.clinicName ? ` • ${dentist.clinicName}` : ''}
            </p>
          </div>
          <button type="button" className="com-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form className="com-form" onSubmit={handleSubmit}>
          {/* Optional Dentist Selector if not preselected */}
          {!dentist && dentistList.length > 0 && (
            <div className="com-field">
              <label className="com-label">Select Dentist *</label>
              <select
                className="com-select"
                value={selectedDentistId}
                onChange={e => setSelectedDentistId(e.target.value)}
                required
              >
                <option value="">-- Choose Dentist --</option>
                {dentistList.map(d => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.name} {d.clinicName ? `(${d.clinicName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. Patient Name */}
          <div className="com-field">
            <label className="com-label">Patient Name *</label>
            <div className="com-input-with-icon">
              <User size={15} className="com-icon-prefix" />
              <input
                type="text"
                className="com-input"
                placeholder="Enter patient full name..."
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 2. Category Selector */}
          <div className="com-field">
            <label className="com-label">Material / Service Category</label>
            <div className="com-cat-tabs">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`com-cat-tab ${activeCategory === cat ? 'com-cat-tab--active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Product Catalog Item & Restoration Type */}
          <div className="com-grid-2">
            <div className="com-field">
              <label className="com-label">Product Item (Rate Card)</label>
              <select
                className="com-select"
                value={selectedProductId}
                onChange={e => handleProductChange(e.target.value)}
              >
                {RATE_CARD.filter(p => p.category === activeCategory).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price.toLocaleString('en-IN')}/{p.metric}
                  </option>
                ))}
              </select>
            </div>

            <div className="com-field">
              <label className="com-label">Restoration Type</label>
              <select
                className="com-select"
                value={restorationType}
                onChange={e => setRestorationType(e.target.value)}
              >
                {RESTORATION_TYPES.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Tooth Selection & Chart (or Arch Selector for Sets) */}
          {currentProduct.metric === 'set' || currentProduct.metric === 'arch' ? (
            <div className="com-field">
              <label className="com-label">Target Arch Selection</label>
              <div className="com-arch-toggles">
                <button
                  type="button"
                  className={`com-arch-btn ${selectedArches.includes('Upper') ? 'com-arch-btn--active' : ''}`}
                  onClick={() => toggleArch('Upper')}
                >
                  <Check size={14} className="com-arch-icon" /> Upper Arch (Maxillary)
                </button>
                <button
                  type="button"
                  className={`com-arch-btn ${selectedArches.includes('Lower') ? 'com-arch-btn--active' : ''}`}
                  onClick={() => toggleArch('Lower')}
                >
                  <Check size={14} className="com-arch-icon" /> Lower Arch (Mandibular)
                </button>
              </div>
            </div>
          ) : (
            <div className="com-field">
              <label className="com-label">Interactive Quadrant Tooth Chart (1–8)</label>
              <ToothChart
                selectedTeeth={selectedTeeth}
                onChange={setSelectedTeeth}
              />
            </div>
          )}

          {/* Clasp counter if Teeth Addition */}
          {currentProduct.id === 'teeth_addition' && (
            <div className="com-clasp-box">
              <div className="com-clasp-info">
                <span className="com-clasp-title">Additional Clasps</span>
                <span className="com-clasp-desc">+₹100 per clasp added</span>
              </div>
              <div className="com-clasp-counter" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TwentyFirstIconButton
                  icon={Ico.minus(14)}
                  title="Decrease Clasps"
                  ariaLabel="Decrease Clasps"
                  onClick={() => setClaspCount(c => Math.max(0, c - 1))}
                  disabled={claspCount <= 0}
                  size="sm"
                  rounded="full"
                  variant="secondary"
                />
                <span className="com-clasp-num" style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700 }}>{claspCount}</span>
                <TwentyFirstIconButton
                  icon={Ico.plus(14)}
                  title="Increase Clasps"
                  ariaLabel="Increase Clasps"
                  onClick={() => setClaspCount(c => c + 1)}
                  size="sm"
                  rounded="full"
                  variant="secondary"
                />
              </div>
            </div>
          )}

          {/* 5. Order Amount */}
          <div className="com-price-section">
            <div className="com-price-header">
              <label className="com-label" style={{ marginBottom: 0 }}>
                Order Amount (₹)
              </label>
            </div>

            <div className="com-input-with-icon">
              <span className="com-currency-sym">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                className="com-input com-price-input"
                placeholder="0"
                value={displayAmount}
                onChange={handleAmountChange}
                required
              />
            </div>

            <p className="com-price-hint">
              Catalog: {currentProduct.name} @ ₹{currentProduct.price.toLocaleString('en-IN')}/{currentProduct.metric}.
              {currentProduct.metric === 'unit' && ` (${selectedTeeth.length || 1} unit(s))`}
            </p>
          </div>

          {/* 6. Priority & Due Date */}
          <div className="com-grid-2">
            <div className="com-field">
              <label className="com-label">Priority</label>
              <select
                className="com-select"
                value={priority}
                onChange={e => setPriority(e.target.value)}
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="com-field">
              <label className="com-label">Due Date</label>
              <div className="com-input-with-icon">
                <Calendar size={15} className="com-icon-prefix" />
                <input
                  type="date"
                  className="com-input"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 7. Clinical Notes */}
          <div className="com-field">
            <label className="com-label">Clinical Notes (Optional)</label>
            <textarea
              className="com-textarea"
              rows={2}
              placeholder="Shade (e.g. A2, B1), preparation details, clinical instructions..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="com-actions">
            <button
              type="button"
              className="com-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="com-submit-btn"
              disabled={isSubmitting || !patientName.trim()}
            >
              {isSubmitting ? (
                <span className="com-spinner" />
              ) : (
                <>Create Order (₹{Number(displayAmount || 0).toLocaleString('en-IN')})</>
              )}
            </button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
}
