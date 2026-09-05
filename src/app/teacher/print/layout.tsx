import type { ReactNode } from "react";

/** Hides site chrome on printable report pages */
export default function PrintLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        header, footer {
          display: none !important;
        }
        main {
          max-width: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        @media print {
          body {
            background: white !important;
          }
        }
      `}</style>
      {children}
    </>
  );
}
