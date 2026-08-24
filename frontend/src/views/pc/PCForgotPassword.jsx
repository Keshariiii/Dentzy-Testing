/**
 * PCForgotPassword — Desktop version of the Forgot Password page.
 *
 * Re-exports the existing ForgotPassword component.
 */
import React from 'react';
import ForgotPassword from '../../components/ForgotPassword';

const PCForgotPassword = (props) => {
    return <ForgotPassword {...props} />;
};

export default PCForgotPassword;
