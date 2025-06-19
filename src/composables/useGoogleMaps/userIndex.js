import { createGoogleMapsCore } from "./userCore";
import { createGoogleMapsPlaces } from "./userPlaces";

export function useGoogleMaps(mapContainerRef, options) {
  const coreMap = createGoogleMapsCore(mapContainerRef, options);

  const placesFunctions = createGoogleMapsPlaces({
    google: () => window.google && window.google.maps ? window.google.maps : null,
    placesService: coreMap.placesService,
    autocompleteService: coreMap.autocompleteService,
    geocoderService: coreMap.geocoderService,
    directionsService: coreMap.directionsService,
    directionsRenderer: coreMap.directionsRenderer,
    map: coreMap.map,
    isFetching: coreMap.isFetching,
    onError: options.onError,
  });

  const displayBarsOnMap = (bars) => {
    coreMap.displayBarsOnMap(bars, placesFunctions.formatBarInfoWindowContent);
  };

  return {
    map: coreMap.map,
    infoWindow: coreMap.infoWindow,
    markers: coreMap.markers,
    searchMarkers: coreMap.searchMarkers,
    google: coreMap.google,
    loading: coreMap.loading,
    isFetching: coreMap.isFetching,
    isReady: coreMap.isReady,

    loadGoogleMapsAPI: coreMap.loadGoogleMapsAPI,
    initMap: coreMap.initMap,
    requestGeolocationPermission: coreMap.requestGeolocationPermission,
    getCurrentLocation: coreMap.getCurrentLocation,
    addMarker: coreMap.addMarker,
    clearMarkers: coreMap.clearMarkers,
    showInfoWindow: coreMap.showInfoWindow,
    closeInfoWindow: coreMap.closeInfoWindow,
    panTo: coreMap.panTo,
    setZoom: coreMap.setZoom,
    displayBarsOnMap,

    getPlacePredictions: placesFunctions.getPlacePredictions,
    getPlaceDetails: placesFunctions.getPlaceDetails,
    searchAndDisplayPlaces: placesFunctions.searchAndDisplayPlaces,
    searchBarsInMapBounds: placesFunctions.searchBarsInMapBounds,
    getGeocode: placesFunctions.getGeocode,
    calculateAndDisplayRoute: placesFunctions.calculateAndDisplayRoute,
    clearDirections: placesFunctions.clearDirections,
    formatBarInfoWindowContent: placesFunctions.formatBarInfoWindowContent,
  };
}