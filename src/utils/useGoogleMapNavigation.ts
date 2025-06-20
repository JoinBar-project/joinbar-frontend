// src/utils/useGoogleMapNavigation.ts
export function navigateToBar(lat: number, lng: number, name?: string) {
  if (!lat || !lng) {
    alert('此酒吧尚未提供定位資訊');
    return;
  }

  const label = encodeURIComponent(name || 'Bar');
  const url = `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${lat},${lng}&travelmode=walking`;

  window.open(url, '_blank');
}
