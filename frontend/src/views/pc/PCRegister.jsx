/**
 * PCRegister — Desktop version of the Register page.
 *
 * Re-exports the existing Register component.
 * All future desktop-specific register changes should live here.
 */
import React from 'react';
import Register from '../../components/Register';

const PCRegister = (props) => {
    return <Register {...props} />;
};

export default PCRegister;
