'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PrintableInvoice from '../../components/common/PrintableInvoice';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batchId');
  const id = searchParams.get('id') || searchParams.get('caseId');
  const unpaid = searchParams.get('unpaid') === 'true';
  const dentistId = searchParams.get('dentistId');
  const month = searchParams.get('month');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice() {
      if (!batchId && !id && !unpaid) {
        setLoading(false);
        setError({
          title: 'Invoice Reference Required',
          message: 'No valid invoice, batch statement, or unpaid bill identifier was provided.',
          status: 400,
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let url;
        if (batchId) {
          url = `/api/payments/batch/${encodeURIComponent(batchId)}`;
        } else if (id) {
          url = `/api/payments/single/${encodeURIComponent(id)}`;
        } else if (unpaid) {
          const q = new URLSearchParams();
          if (dentistId) q.set('dentistId', dentistId);
          if (month && month !== 'all') q.set('month', month);
          url = `/api/payments/unpaid-statement${q.toString() ? '?' + q.toString() : ''}`;
        }

        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));

        if (!isMounted) return;

        if (!res.ok) {
          if (res.status === 401) {
            setError({
              title: 'Authentication Required',
              message: 'Please log in to your Dentzy account to view and download this official invoice.',
              status: 401,
            });
          } else if (res.status === 403) {
            setError({
              title: 'Access Restricted',
              message: 'You do not have authorization to view this invoice statement.',
              status: 403,
            });
          } else if (res.status === 404) {
            setError({
              title: 'Invoice Not Found',
              message: 'The requested invoice statement does not exist or may have been deleted.',
              status: 404,
            });
          } else {
            setError({
              title: 'Failed to Load Invoice',
              message: data.message || 'An error occurred while retrieving the invoice record.',
              status: res.status,
            });
          }
          setLoading(false);
          return;
        }

        if (batchId || unpaid) {
          setStatementData(data);
        } else {
          setPaymentData(data);
        }
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setLoading(false);
        setError({
          title: 'Network Communication Error',
          message: 'Unable to reach the laboratory server. Please check your network connection.',
          status: 500,
        });
      }
    }

    loadInvoice();

    return () => {
      isMounted = false;
    };
  }, [batchId, id, unpaid, dentistId, month]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: '12px', background: '#f4f6f5' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e8f5ee', borderTopColor: '#1e5038', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: '#1e5038', fontSize: '15px', fontWeight: 500 }}>Loading official document...</span>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f4f6f5', padding: '24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>{error.title}</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>{error.message}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {error.status === 401 && (
              <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', background: '#1e5038', color: '#ffffff', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s' }}>
                Log In to Dentzy
              </a>
            )}
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', background: '#f4f6f5', color: '#374151', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
              Return to Home
            </a>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#708c80', lineHeight: 1.6 }}>
            <div>Dentzy Dental Laboratory · Vasai West - 401202</div>
            <div>Support: <a href="tel:+919503668112" style={{ color: '#1e5038', textDecoration: 'none', fontWeight: 500 }}>+91 9503668112</a> · <a href="mailto:support@dentzy.in" style={{ color: '#1e5038', textDecoration: 'none', fontWeight: 500 }}>support@dentzy.in</a></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf9', padding: '16px 0' }}>
      <PrintableInvoice statement={statementData} payment={paymentData} isStandalone={true} />
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#1e5038' }}>Loading...</div>}>
      <InvoiceContent />
    </Suspense>
  );
}
