import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bla-dark px-6 text-white">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#ceff00]">
        404
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Pagina niet gevonden</h1>
      <p className="mt-2 max-w-md text-center text-sm text-white/50">
        Deze URL bestaat niet (meer). Ga terug naar het overzicht.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-[#ceff00] px-5 py-2 text-sm font-semibold text-bla-dark"
      >
        Naar tools
      </Link>
    </div>
  );
}
