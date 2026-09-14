"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bla-dark px-6 text-white">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#ceff00]">
        Fout
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Er ging iets mis</h1>
      <p className="mt-2 max-w-md text-center text-sm text-white/50">
        Probeer opnieuw te laden. Als het blijft gebeuren, ververs de pagina.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-[#ceff00] px-5 py-2 text-sm font-semibold text-bla-dark"
      >
        Opnieuw
      </button>
    </div>
  );
}
