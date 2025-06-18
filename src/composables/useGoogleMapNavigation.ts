export function useGoogleMapNavigation() {
  const navigateToBar = (bar: { location?: { lat: number; lng: number } }) => {
    if (bar.location) {
      const { lat, lng } = bar.location;
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      alert('酒吧位置資訊不完整，無法導航。');
    }
  };

  return { navigateToBar };
}