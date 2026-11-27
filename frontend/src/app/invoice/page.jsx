'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PrintableInvoice from '../../components/common/PrintableInvoice';
import { InvoiceSkeleton } from '../../components/SkeletonBlocks';
import PortalStatusPage, {
  statusBtnPrimaryStyle,
  statusBtnSecondaryStyle,
} from '@/components/common/PortalStatusPage';

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
    return <InvoiceSkeleton />;
  }

  if (error) {
    return (
      <PortalStatusPage
        eyebrow={error.status ? `Invoice · HTTP ${error.status}` : 'Invoice'}
        title={error.title}
        paragraphs={[
          error.message,
          "Make sure you're signed in to the Dentzy clinic or admin account associated with this invoice.",
        ]}
        actions={
          <>
            {error.status === 401 && (
              <a href="/login" style={statusBtnPrimaryStyle}>
                Sign in to Dentzy
              </a>
            )}
            <a href="/" style={error.status === 401 ? statusBtnSecondaryStyle : statusBtnPrimaryStyle}>
              Return to Home
            </a>
          </>
        }
      />
    );
  }

  return (
    <div className="dz-min-vh" style={{ background: '#f8faf9', padding: '16px 0' }}>
      <PrintableInvoice statement={statementData} payment={paymentData} isStandalone={true} />
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <InvoiceContent />
    </Suspense>
  );
}
