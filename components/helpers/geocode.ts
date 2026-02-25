export async function geocodeHere(endereco: string) {
  const q = endereco.trim();
  if (!q) return null;

  const key = process.env.NEXT_PUBLIC_HERE_API_KEY || "";
  if (!key) throw new Error("HERE API key não configurada (NEXT_PUBLIC_HERE_API_KEY).");

  const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(q)}&apiKey=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  const data = await res.json();

  const item = data?.items?.[0];
  const lat = item?.position?.lat;
  const lng = item?.position?.lng;

  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { latitude: lat, longitude: lng };
}