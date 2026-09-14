"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#151f28",
          color: "#fbfcfa",
          fontFamily: "Host Grotesk, system-ui, sans-serif",
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#ceff00" }}>
          Fout
        </p>
        <h1 style={{ marginTop: 12, fontSize: 24 }}>Er ging iets mis</h1>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 24,
            border: 0,
            borderRadius: 999,
            background: "#ceff00",
            color: "#151f28",
            padding: "8px 20px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Opnieuw
        </button>
      </body>
    </html>
  );
}
