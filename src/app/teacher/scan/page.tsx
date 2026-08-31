import { QrScanner } from "@/components/QrScanner";

export default function ScanPage() {
  return (
    <div className="rounded-2xl bg-[var(--paper)] p-6 shadow-[0_10px_40px_rgba(0,31,63,0.06)] sm:p-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--navy)]">
        Scan student QR
      </h1>
      <p className="mt-2 text-[var(--ink-muted)]">
        Use a phone or tablet camera to jump straight to a student&apos;s balance page.
      </p>
      <div className="mt-6">
        <QrScanner />
      </div>
    </div>
  );
}
