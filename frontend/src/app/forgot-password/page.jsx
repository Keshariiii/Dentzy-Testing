'use client';
/**
 * Forgot Password page — Public route (no auth guard needed).
 */
import ResponsiveLayout from '../../layouts/ResponsiveLayout';
import PCForgotPassword from '../../views/pc/PCForgotPassword';
import MobileForgotPassword from '../../views/mobile/MobileForgotPassword';

export default function ForgotPasswordPage() {
  return <ResponsiveLayout pcView={<PCForgotPassword />} mobileView={<MobileForgotPassword />} />;
}
