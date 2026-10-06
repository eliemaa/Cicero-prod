"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="notice error" role="alert">
      <h2>Content could not load.</h2>
      <p>Check your connection and try again. Your saved content is safe.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
