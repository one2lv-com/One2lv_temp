export default function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f', color: '#00ffcc', fontFamily: 'monospace' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>404</h1>
        <p style={{ opacity: 0.6 }}>Page not found.</p>
      </div>
    </div>
  );
}
