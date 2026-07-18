import { useState } from 'react';
import { trpc } from '@/lib/trpc';

export function ImageUpload({
  value,
  onChange,
  label = 'Campaign Image',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const uploadMutation = trpc.contact.uploadImage.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      try {
        const result = await uploadMutation.mutateAsync({
          data: base64,
          filename,
        });
        onChange(result.url);
      } catch (err) {
        alert('Upload failed: ' + (err as Error).message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </label>
      {value && (
        <div className="mb-2">
          <img src={value} alt="Preview" className="h-24 w-auto rounded object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="admin-input flex-1"
          style={{ padding: '8px' }}
        />
        {uploading && <span className="text-xs self-center" style={{ color: 'var(--text-secondary)' }}>Uploading...</span>}
      </div>
      <input
        placeholder="Or enter image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input"
      />
    </div>
  );
}
