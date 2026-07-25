"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImageUpload({
  name,
  label = "Poză",
}: {
  name: string;
  label?: string;
}) {
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Trebuie să fii autentificat.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("public-media")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("public-media").getPublicUrl(path);
    setUploadedUrl(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-zinc-500">{label}</label>
      <input type="hidden" name={name} value={uploadedUrl} />
      <div className="flex items-center gap-3">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Previzualizare" className="h-16 w-16 rounded-xl object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="min-h-11 flex-1 rounded-xl border px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
      </div>
      {uploading && <p className="text-xs text-zinc-500">Se încarcă...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
