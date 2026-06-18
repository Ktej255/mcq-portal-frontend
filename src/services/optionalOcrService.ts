// Digitises an uploaded answer image via the OCR route. Returns text when a
// vision key is configured; null otherwise (client then shows "OCR pending").
export async function digitiseAnswerImage(imageBase64: string, mimeType: string): Promise<{ text: string | null; live: boolean }> {
  try {
    const res = await fetch("/api/optional/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    const data = await res.json();
    if (data?.ok && data.text) return { text: String(data.text), live: true };
  } catch {
    /* fall through */
  }
  return { text: null, live: false };
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}
