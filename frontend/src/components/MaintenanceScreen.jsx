'use client';

// ponytail: Upgraded 21st.dev error-5 Under Maintenance Portal View with Dentzy brand styling
import React from 'react';
import Error5 from './ui/error-5';

export default function MaintenanceScreen({ role = 'dentist', onRestored }) {
  return <Error5 role={role} onRestored={onRestored} />;
}
