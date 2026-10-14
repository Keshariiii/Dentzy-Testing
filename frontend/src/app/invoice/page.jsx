'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PrintableInvoice from '../../components/common/PrintableInvoice';

function InvoiceContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('caseId');
  const batchId = searchParams.get('batchId');
  const patient = searchParams.get('patient') || searchParams.get('patientName');
  const dentist = searchParams.get('dentist') || searchParams.get('doctor');
  const clinic = searchParams.get('clinic');
  const amount = Number(searchParams.get('amount')) || 0;
  const status = searchParams.get('status') || 'Paid';
  const mode = searchParams.get('mode') || 'UPI';
  const ref = searchParams.get('ref') || searchParams.get('referenceNumber') || '';
  const service = searchParams.get('service') || 'Dental Prosthetics';

  const [statementData, setStatementData] = useState(null);

  useEffect(() => {
    // If batchId or caseId provided, construct statement payload
    const dummyPayment = {
      caseId: caseId || batchId || 'DZ-RECEIPT',
      invoiceNumber: batchId ? `STMT-${batchId}` : `INV-${caseId || 'OFFICIAL'}`,
      patientName: patient || 'Patient',
      dentistName: dentist || 'Registered Practitioner',
      clinicName: clinic || 'Dental Clinic',
      amount: amount,
      paymentStatus: status,
      paymentMode: mode,
      referenceNumber: ref,
      serviceType: service,
      paidAt: new Date().toISOString(),
    };
    setStatementData(dummyPayment);
  }, [caseId, batchId, patient, dentist, clinic, amount, status, mode, ref, service]);

  if (!statementData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#1e5038' }}>
        <span>Loading invoice…</span>
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
