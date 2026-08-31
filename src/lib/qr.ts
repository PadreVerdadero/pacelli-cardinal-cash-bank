import QRCode from "qrcode";

export function studentUrl(qrToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/students/${qrToken}`;
}

export async function studentQrDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(studentUrl(qrToken), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: {
      dark: "#001F3F",
      light: "#FFFFFF",
    },
  });
}
