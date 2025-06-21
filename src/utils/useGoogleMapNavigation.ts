export const navigateToBar = (bar) => {
  const lat = bar.latitude || bar.location?.lat;
  const lng = bar.longitude || bar.location?.lng;

  if (!lat || !lng) {
    alert('此酒吧尚未提供定位資訊');
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${lat},${lng}&travelmode=walking`;
  window.open(url, '_blank');
};
