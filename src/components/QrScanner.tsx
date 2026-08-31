"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function extractStudentPath(decoded: string): string | null {
  try {
    const url = new URL(decoded);
    if (url.pathname.startsWith("/students/")) {
      return url.pathname;
    }
  } catch {
    if (decoded.startsWith("/students/")) return decoded;
    if (/^[a-z0-9]+$/i.test(decoded)) return `/students/${decoded}`;
  }
  return null;
}

export function QrScanner() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => undefined);
      }
    };
  }, []);

  async function startScan() {
    setError(null);
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          const path = extractStudentPath(decoded);
          if (!path) return;
          void scanner.stop().then(() => {
            setScanning(false);
            router.push(path);
          });
        },
        () => undefined,
      );
    } catch {
      setScanning(false);
      setError("Could not access the camera. Check browser permissions and try again.");
    }
  }

  async function stopScan() {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) {
      await scanner.stop();
    }
    setScanning(false);
  }

  return (
    <div>
      <div
        id="qr-reader"
        className="mx-auto max-w-md overflow-hidden rounded-md border border-[var(--navy)]/15 bg-black/5"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {!scanning ? (
          <button
            type="button"
            onClick={startScan}
            className="rounded-md bg-[var(--cardinal-red)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--cardinal-red-hot)]"
          >
            Start camera scan
          </button>
        ) : (
          <button
            type="button"
            onClick={stopScan}
            className="rounded-md border border-[var(--navy)] px-4 py-2 text-sm font-medium text-[var(--navy)]"
          >
            Stop scan
          </button>
        )}
      </div>
      {error ? <p className="mt-3 text-sm text-[var(--cardinal-red)]">{error}</p> : null}
      <p className="mt-4 text-sm text-[var(--ink-muted)]">
        Point the camera at a student QR code. You will be taken to that student&apos;s balance page.
      </p>
    </div>
  );
}
