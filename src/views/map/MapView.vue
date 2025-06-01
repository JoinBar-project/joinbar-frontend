<template>
  <div class="search-panel">
    <div class="input-group">
      <input
        type="text"
        id="searchInput" 
        class="input search-input"
        v-model="searchQuery"
        placeholder="輸入地點名稱"
        @input="onInputChange"
      />
      <button @click="handleSearch"  class="btn bg-[#decdd5] hover:bg-[#860914] text-white rounded-r-lg font-normal search-bt">🔍 搜尋</button>
      <ul v-if="suggestions.length" class="suggestions-list">
        <li v-for="(suggestion, index) in suggestions" :key="index" @click="selectSuggestion(suggestion)">
          🔍 {{ suggestion.description }}
        </li>
      </ul>
    </div>
      <button @click="getCurrentLocation" class="btn font-normal place-now">📍 顯示我目前位置</button>
  </div>

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
let markers = []
let infoWindow
let autocompleteService = null
let placesService
let currentMarker

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

// 允許直接滾輪縮放、不顯示提示
    gestureHandling: 'greedy',
    restriction: {
      latLngBounds: {
        north: 25.5,
        south: 21.5,
        east: 122.2,
        west: 119.3
      },
      strictBounds: false
    },
    mapTypeControl: false,
    zoomControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,

    // 把地圖上預設的商家、餐廳、學校、醫院等圖示 (poi, Point of Interest) 都隱藏掉
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
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

// 搜尋附近的「酒吧」並加上 marker
function searchNearbyBars(location) {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    console.error('searchNearbyBars: 無效的位置', location)
    return
  }

  clearMarkers()

  const request = {
    location,
    radius: 1500,
    type: ['bar']
  }

  placesService.nearbySearch(request, (results, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK || results.length === 0) {
      console.warn('附近找不到酒吧，狀態：', status)
      return
    }

    const bounds = new google.maps.LatLngBounds()

    results.forEach(place => {
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
              const content = `
                <strong>${details.name}</strong><br/>
                地址：${details.formatted_address}<br/>
                評分：${details.rating}<br/>
                ${details.website ? `<a href="${details.website}" target="_blank">網站</a>` : ''}
              `
              infoWindow.setContent(content)
              infoWindow.open(map, marker)
            }
          }
        )
      })

      markers.push(marker)
      bounds.extend(place.geometry.location)
    })

    map.fitBounds(bounds)
  })
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

// 搜尋 - 防抖機制
const onInputChange= debounce(() =>{
  if (!autocompleteService || !searchQuery.value) {
    suggestions.value = []
    return
  }

  autocompleteService.getPlacePredictions(
    {
      input: searchQuery.value,
      componentRestrictions: { country: 'tw' },
      location: map.getCenter(), 
      radius: 18000
    },
    (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        suggestions.value = predictions
      } else {
        suggestions.value = []
      }
    }
  )
}, 300)

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
.search-panel{
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: absolute;
  top: 120px;
  left: 30px;
  background-color: rgba(255, 255, 255,0.5);
  z-index: 10;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(48, 21, 21, 0.2);
} 
.input-group{
  display: flex;
  position: relative;
  margin-left: 10px;
}
.search-input{
  height: 40px;
  padding: 8px 12px;
  font-size: 16px;
  margin-top: 10px;
  border: 1px solid #decdd5;
  border-right: none;
  border-radius: 5px 0 0 5px;
  outline: none;
  flex: 1;
}
.search-bt{
  background-color: #decdd5;
  color: #ffffff;
  padding: 8px;
  margin: 10px 0 5px 0px;
  border-radius: 0px 5px 5px 0px;
  border: 0px;
  cursor: pointer;
}
.search-bt:hover{
  background-color: #860914;
}
.place-now {
  padding: 8px 12px;
  margin: 10px;
  height: 40px;
  border: none;
  background-color: #decdd5;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
}
.place-now:hover {
  background-color: #860914;
}
.suggestions-list {
  position: absolute;
  top:100%;
  left: 0;
  right: 0;
  z-index: 10;
  list-style: none;
  margin: 0;
  padding: 0;
  background: white;
  border: 1px solid #ddd;
  max-height: 200px;
  overflow-y: auto;
}
.suggestions-list li {
  padding: 8px;
  cursor: pointer;
}
.suggestions-list li:hover {
  background: #f0f0f0;
}
.custom-loading{
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.8); 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.loader {
  width: 50px;
  --b: 6px;
  aspect-ratio: 1;
  border-radius: 50%;
  padding: 1px;
  background: conic-gradient(#0000 10%, #afb18c) content-box;
  -webkit-mask:
    repeating-conic-gradient(#0000 0deg, #000 1deg 20deg, #0000 21deg 36deg),
    radial-gradient(farthest-side, #0000 calc(100% - var(--b) - 1px), #000 calc(100% - var(--b)));
  -webkit-mask-composite: destination-in;
          mask-composite: intersect;
  animation: l4 1s infinite steps(10);
}
@keyframes l4 {
  to {
    transform: rotate(1turn);
  }
}
.loading-message {
  margin-top: 12px;
  font-weight: bold;
  font-size: 20px;
  color: #333;
}
</style>