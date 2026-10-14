'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import PrintableInvoice from '../../components/common/PrintableInvoice';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');
  const batchId = searchParams.get('batchId');
  const id = searchParams.get('id');

  const { user, authFetch, loading: authLoading } = useAuth();
  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError('Please log in to view verified invoices.');
      return;
    }

    if (!caseId && !batchId && !id) {
      setLoading(false);
      setError('No invoice identifier provided.');
      return;
    }

    let isMounted = true;
    async function loadVerifiedPayment() {
      try {
        const res = await authFetch('/api/dashboard/payments');
        if (!res.ok) {
          throw new Error('Unable to fetch payment records');
        }
        const data = await res.json();
        const payments = data?.payments || [];
        
        // Find matching verified payment
        const found = payments.find(p => 
          (id && (p.id === id || p._id === id)) ||
          (caseId && p.caseId === caseId) ||
          (batchId && p.batchId === batchId)
        );

        if (!found) {
          if (isMounted) {
            setError('Invoice not found or you do not have permission to view it.');
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setStatementData({
            ...found,
            dentistName: user.name || 'Doctor',
            clinicName: user.clinicName || 'Dental Clinic',
          });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load invoice.');
          setLoading(false);
        }
      }
    }

    loadVerifiedPayment();
    return () => { isMounted = false; };
  }, [user, authLoading, caseId, batchId, id, authFetch]);

  if (loading || authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#1e5038' }}>
        <span>Loading verified invoice…</span>
      </div>
    );
  }

  if (error || !statementData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#7a3838', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>{error || 'Invoice not found.'}</p>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Only verified invoices from your authenticated portal session can be viewed or printed.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', padding: '16px 0' }}>
      <PrintableInvoice payment={statementData} isStandalone={true} />
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#1e5038' }}>Loading…</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
