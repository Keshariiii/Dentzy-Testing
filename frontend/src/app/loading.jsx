/**
 * Route-level loading state for the home page.
 * Shown by Next.js Suspense while the page component loads.
 */
export default function HomeLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--dz-color-bg-page, #f4f7f5)',
      fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          margin: '0 auto 16px',
          border: '3px solid var(--dz-color-border, #e2e8f0)',
          borderTopColor: 'var(--dz-color-primary-dark, #4a6a5a)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}
