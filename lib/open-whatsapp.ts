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

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  if (desktopWindow && !desktopWindow.closed) desktopWindow.location.href = whatsappUrl;
  else window.location.href = whatsappUrl;
  return true;
}
