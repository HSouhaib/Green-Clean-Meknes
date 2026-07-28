import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function GalleryUpload({
  value,
  onChange,
  label,
  max = 10,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  max?: number;
}) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const uploadMutation = trpc.contact.uploadImage.useMutation();

  const addImage = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) return;
    if (value.length >= max) return;
    onChange([...value, trimmed]);
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      let current = [...value];
      for (const file of files) {
        if (current.length >= max) break;
        const base64 = await readFileAsDataURL(file);
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const result = await uploadMutation.mutateAsync({ data: base64, filename });
        if (!current.includes(result.url)) {
          current = [...current, result.url];
          onChange(current);
        }
      }
    } catch (err) {
      toast.error(t("admin.shared.upload_failed").replace("{message}", (err as Error).message));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddUrl = () => {
    addImage(urlInput);
    setUrlInput("");
  };

  return (
    <div className="space-y-3">
      <label
        className="block text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label ?? t("admin.shared.gallery_label")} ({value.length}/{max})
      </label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group rounded overflow-hidden"
              style={{
                width: "96px",
                height: "96px",
                background: "var(--bg-surface-light)",
              }}
            >
              <img
                src={url}
                alt={t("admin.shared.gallery_alt").replace("{index}", String(index + 1))}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                aria-label={t("admin.shared.remove_image")}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading || value.length >= max}
          className="admin-input"
          style={{ padding: "8px" }}
        />
        {uploading && (
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {t("admin.shared.uploading")}
          </span>
        )}
        <div className="flex gap-2">
          <input
            placeholder={t("admin.shared.gallery_url_placeholder")}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            disabled={value.length >= max}
            className="admin-input flex-1"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim() || value.length >= max}
            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            style={{
              background: "var(--accent-green)",
              color: "var(--bg-primary)",
            }}
          >
            {t("admin.shared.add")}
          </button>
        </div>
      </div>
    </div>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
