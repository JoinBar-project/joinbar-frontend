// import { ref, onUnmounted } from 'vue'

// let isLoading = false
// let isLoaded = false
// let loadPromise = null

// export function useGoogleMaps() {
//   const loading = ref(false)
//   const error = ref(null)
//   const map = ref(null)
//   const markers = ref([])

//   const loadGoogleMapsAPI = () => {
//     if (isLoaded && window.google && window.google.maps) {
//       return Promise.resolve(window.google)
//     }

//     if (isLoading && loadPromise) {
//       return loadPromise
//     }

//     isLoading = true
//     loading.value = true

//     loadPromise = new Promise((resolve, reject) => {
//       const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
//       if (existingScript) {
//         if (window.google && window.google.maps) {
//           isLoaded = true
//           isLoading = false
//           loading.value = false
//           resolve(window.google)
//           return
//         }
        
//         existingScript.addEventListener('load', () => {
//           isLoaded = true
//           isLoading = false
//           loading.value = false
//           resolve(window.google)
//         })
//         return
//       }

//       const script = document.createElement('script')
//       const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      
//       if (!apiKey) {
//         const errorMsg = 'Google Maps API Key 未設定'
//         error.value = errorMsg
//         loading.value = false
//         isLoading = false
//         reject(new Error(errorMsg))
//         return
//       }

//       script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
//       script.async = true
//       script.defer = true
      
//       script.onload = () => {
//         isLoaded = true
//         isLoading = false
//         loading.value = false
//         resolve(window.google)
//       }
      
//       script.onerror = () => {
//         const errorMsg = 'Google Maps API 載入失敗'
//         error.value = errorMsg
//         loading.value = false
//         isLoading = false
//         reject(new Error(errorMsg))
//       }
//       document.head.appendChild(script)
//     })

//     return loadPromise
//   }

//   const initMap = async (element, options = {}) => {
//     try {
//       error.value = null
//       await loadGoogleMapsAPI()

//       const defaultOptions = {
//         center: { lat: 25.0330, lng: 121.5654 }, // 台北
//         zoom: 13,
//         mapTypeControl: true,
//         streetViewControl: true,
//         fullscreenControl: true
//       }

//       map.value = new window.google.maps.Map(element, {
//         ...defaultOptions,
//         ...options
//       })

//       return map.value
//     } catch (err) {
//       console.error('地圖初始化失敗:', err)
//       error.value = err.message
//       throw err
//     }
//   }

//   const addMarker = (position, options = {}) => {
//     if (!map.value) return null

//     const marker = new window.google.maps.Marker({
//       position,
//       map: map.value,
//       ...options
//     })

//     markers.value.push(marker)
//     return marker
//   }

//   const addInfoWindow = (marker, content) => {
//     const infoWindow = new window.google.maps.InfoWindow({
//       content
//     })

//     marker.addListener('click', () => {
//       infoWindow.open(map.value, marker)
//     })

//     return infoWindow
//   }

//   const clearMarkers = () => {
//     markers.value.forEach(marker => {
//       marker.setMap(null)
//     })
//     markers.value = []
//   }

//   onUnmounted(() => {
//     clearMarkers()
//     map.value = null
//   })

//   return {
//     loading,
//     error,
//     map,
//     markers,
//     loadGoogleMapsAPI,
//     initMap,
//     addMarker,
//     addInfoWindow,
//     clearMarkers
//   }
// }