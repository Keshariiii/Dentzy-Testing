/**
 * PCLogin — Desktop version of the Login page.
 *
 * Re-exports the existing Login component.
 * All future desktop-specific login changes should live here.
 */
import React from 'react';
import Login from '../../components/Login';

const PCLogin = (props) => {
    return <Login {...props} />;
};

export default PCLogin;
