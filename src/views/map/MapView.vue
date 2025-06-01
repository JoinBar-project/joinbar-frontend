<template>

  <!-- loading -->
  <div v-if="isSearching" class="custom-loading">
    <div class="loader"></div>
    <p class="loading-message">Loading ...</p>
  </div>

  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import debounce from 'lodash/debounce'

const searchQuery = ref('')
const suggestions = ref([])
const mapContainer = ref(null)

// 定義 loading 狀態
const isSearching = ref(false)

let map
let infoWindow
let autocompleteService = null
let placesService


const defaultCenter = { lat: 25.0375, lng: 121.5637 }

// 新增：動態載入 Google Maps 相關 script
function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      const extScript = document.createElement('script')
      extScript.type = 'module'
      extScript.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js'
      extScript.onload = resolve
      extScript.onerror = reject
      document.head.appendChild(extScript)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  try {
    await loadGoogleMapsScript()

    navigator.geolocation.getCurrentPosition(

    // 如果成功，使用使用者位置；失敗就 fallback 用預設的 defaultCenter
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        initMap(userLocation)
      },
      (error) => {
        console.warn('定位失敗或用戶不同意存取定位，使用預設位置', error)
        initMap(defaultCenter)
      }
    )
  } catch (err) {
    console.error('地圖載入失敗：', err)
  }
})

function initMap(center, shouldGetCurrent = false) {
  map = new google.maps.Map(mapContainer.value, {
    center,
    zoom: 12,

  })

  infoWindow = new google.maps.InfoWindow()
  placesService = new google.maps.places.PlacesService(map)
  autocompleteService = new google.maps.places.AutocompleteService()

  if (shouldGetCurrent) {
    getCurrentLocation()
  } else {
    searchNearbyBars(center)
  }
}


function requestGeolocationPermission() {
  if (!navigator.geolocation) {
    console.warn('瀏覽器不支援地理位置存取')
    searchNearbyBars(defaultCenter)
    return
  }

  navigator.geolocation.getCurrentPosition(
    () => {
      console.log('使用者已允許位置權限')
    },
    (err) => {
      console.warn('使用者未允許位置權限，錯誤碼:', err.code)
    }
  )
}


function selectSuggestion(suggestion) {
  searchQuery.value = suggestion.description
  suggestions.value = []
  searchPlaceByText(suggestion.description)
}

function handleSearch() {
  if (!searchQuery.value) {
    alert('請輸入搜尋關鍵字')
    return
  }
  searchPlaceByText(searchQuery.value)
}

function searchPlaceByText(query) {
  isSearching.value = true
  placesService.textSearch(
    {
      query,
      location: map.getCenter(),
      radius: 50000,
      region: 'tw',
    },
    (results, status) => {
      setTimeout(() => {
        isSearching.value = false
      }, 200) // 人為 delay 0.2 秒讓 loading 看得見

      if (status !== google.maps.places.PlacesServiceStatus.OK || !results.length) {
        alert('找不到地點')
        return
      }

      clearMarkers()

      const bounds = new google.maps.LatLngBounds()

      results.forEach((place) => {
        if (!place.geometry || !place.geometry.location) return

        const marker = new google.maps.Marker({
          map,
          position: place.geometry.location,
          title: place.name
        })

        marker.addListener('click', () => {
          placesService.getDetails(
            {
              placeId: place.place_id,
              fields: ['name', 'formatted_address', 'rating', 'website']
            },
            (details, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                infoWindow.setContent(`
                  <strong>${details.name}</strong><br/>
                  地址：${details.formatted_address}<br/>
                  評分：${details.rating}<br/>
                  ${details.website ? `<a href="${details.website}" target="_blank">網站</a>` : ''}
                `)
                infoWindow.open(map, marker)
              }
            }
          )
        })

        markers.push(marker)
        bounds.extend(place.geometry.location)
      })

      map.fitBounds(bounds)
    }
  )
}

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null))
  markers = []
}

function getCurrentLocation() {
  console.log('Getting current location...')
  if (!navigator.geolocation) {
    alert('你的瀏覽器不支援定位功能')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      map.setCenter(location)
      map.setZoom(15)

      // 加入 marker
      if (!currentMarker) {
        currentMarker = new google.maps.Marker({
          map,
          position: location,
        })
          currentMarker.addListener('click', () => {
          showCurrentLocationInfo(location)
        })
      } else {
        currentMarker.setPosition(location)
      }
  
  function showCurrentLocationInfo(location) {
  const geocoder = new google.maps.Geocoder()
  geocoder.geocode({ location }, (results, status) => {
    if (status === 'OK' && results[0]) {
      const address = results[0].formatted_address
      infoWindow.setContent(`<strong>你現在的位置</strong><br/>${address}`)
    } else {
      infoWindow.setContent(`<strong>你現在的位置</strong><br/>（無法取得地址資訊）`)
    }
    infoWindow.open(map, currentMarker)
  })
}

      // 搜尋附近酒吧
      searchNearbyBars(location)
    },
    (error) => {
      alert('無法取得你的位置，錯誤代碼：' + error.code)
      console.error(error)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

</script>

<style scoped>
.map-container {
  width: 100%;
  height: 600px;
  position: relative;
}

</style>