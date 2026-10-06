export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="loading">
      <div className="skeleton" />
      <div className="skeleton" />
      <p>Loading your content…</p>
    </div>
  );
}
