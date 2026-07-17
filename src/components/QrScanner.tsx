import { useEffect, useRef, useState, useId } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
  loadingMessage?: string;
  noCameraMessage?: string;
}

export default function QrScanner({
  onScan,
  onError,
  loadingMessage = "Starting camera...",
  noCameraMessage = "No camera found",
}: QrScannerProps) {
  const reactId = useId();
  const elementId = `qr-reader-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [status, setStatus] = useState<"loading" | "scanning" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then(cameras => {
        if (!active) return;
        if (cameras.length === 0) {
          setStatus("error");
          setMessage(noCameraMessage);
          onError?.(noCameraMessage);
          return;
        }

        const backCamera = cameras.find(c =>
          c.label.toLowerCase().includes("back")
        );
        const cameraId = backCamera ? backCamera.id : cameras[0].id;

        scanner
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 240, height: 240 } },
            decodedText => {
              if (decodedText) {
                onScan(decodedText);
              }
            },
            () => {
              // Frame-level decode errors are ignored; the scanner keeps trying.
            }
          )
          .then(() => {
            if (active) {
              setStatus("scanning");
              startedRef.current = true;
            }
          })
          .catch(err => {
            if (!active) return;
            setStatus("error");
            const msg = err instanceof Error ? err.message : "Camera error";
            setMessage(msg);
            onError?.(msg);
          });
      })
      .catch(err => {
        if (!active) return;
        setStatus("error");
        const msg =
          err instanceof Error ? err.message : "Camera permission denied";
        setMessage(msg);
        onError?.(msg);
      });

    return () => {
      active = false;
      if (startedRef.current && scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      } else if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
      }
      scannerRef.current = null;
      startedRef.current = false;
    };
  }, [elementId, onScan, onError, loadingMessage, noCameraMessage]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        id={elementId}
        className="w-full rounded-xl overflow-hidden"
        style={{ minHeight: 260, background: "var(--bg-surface)" }}
      />
      {status === "loading" && (
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          {loadingMessage}
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-center" style={{ color: "#ef4444" }}>
          {message}
        </p>
      )}
    </div>
  );
}
