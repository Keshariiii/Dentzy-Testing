/**
 * Route-level loading state for the login page.
 */
export default function LoginLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--dz-color-bg-page, #f4f7f5)',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--dz-color-border, #e2e8f0)',
        borderTopColor: 'var(--dz-color-primary-dark, #4a6a5a)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
