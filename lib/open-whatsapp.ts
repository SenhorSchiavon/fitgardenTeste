export function isMobileWhatsAppDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const isPhoneOrTablet = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent);
  const isTouchIpad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isPhoneOrTablet || isTouchIpad;
}

type OpenWhatsAppOptions = {
  phone: string;
  message: string;
  desktopWindow?: Window | null;
};

export function openWhatsApp({ phone, message, desktopWindow }: OpenWhatsAppOptions) {
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  if (!cleanPhone || typeof window === "undefined") {
    desktopWindow?.close();
    return false;
  }

  const query = `phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

  if (!isMobileWhatsAppDevice()) {
    const webUrl = `https://web.whatsapp.com/send?${query}`;
    if (desktopWindow && !desktopWindow.closed) desktopWindow.location.href = webUrl;
    else window.open(webUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  // No celular, chama o aplicativo diretamente e evita a pagina intermediaria
  // do api.whatsapp.com, que em alguns aparelhos oferece a instalacao novamente.
  desktopWindow?.close();
  const appUrl = `whatsapp://send?${query}`;
  const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  let fallbackTimer: number | undefined;

  const stopFallback = () => {
    if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", stopFallback);
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") stopFallback();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", stopFallback, { once: true });
  window.location.href = appUrl;
  fallbackTimer = window.setTimeout(() => {
    stopFallback();
    if (document.visibilityState === "visible") window.location.href = fallbackUrl;
  }, 3000);
  return true;
}
