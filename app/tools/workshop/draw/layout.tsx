import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schets",
  robots: "noindex, nofollow",
};

/** Minimal chrome — only the canvas. */
export default function DrawLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-0 h-[100dvh] w-screen overflow-hidden bg-[#f7f6f2] p-0">
      {children}
    </div>
  );
}
