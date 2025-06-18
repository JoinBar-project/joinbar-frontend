export function useGoogleMapNavigation() {
  const navigateToBar = async (bar: { location?: { lat: number; lng: number } }) => {
    if (!bar.location) {
      alert('找不到酒吧位置，無法導航。');
      return;
    }

    const barLat = bar.location.lat;
    const barLng = bar.location.lng;

    try{
      const getUserLocation = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      };
      const position = await getUserLocation();
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const lat = bar.location.lat;
      const lng = bar.location.lng;
      const directionUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${barLat},${barLng}&travelmode=walking`;
      window.open(directionUrl, '_blank');
    } catch (err) {
      alert('無法取得目前位置，請檢查定位權限');
      console.error(err);
    }
  };

  return { navigateToBar };
}

