"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: 48, fontFamily: "sans-serif" }}>
      <h1>This page could not load.</h1>
      <p>Please try again in a moment.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
