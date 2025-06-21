import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const useCartStore = defineStore('cart', () => {
  const items = ref([]) 
  const loading = ref(false)
  const error = ref(null)
  
  if (import.meta.env.DEV) {
    console.log('🔧 購物車 Store 初始化:', { items: items.value })
  }
  
  const useServerCart = computed(() => {
    return !!localStorage.getItem('access_token')
  })
  
  const itemCount = computed(() => {
    if (!Array.isArray(items.value)) {
      console.warn('⚠️ items.value 不是陣列:', items.value)
      return 0
    }
    return items.value.reduce((total, item) => total + (item.quantity || 1), 0)
  })

  const totalPrice = computed(() => {
    if (!Array.isArray(items.value)) {
      console.warn('⚠️ items.value 不是陣列:', items.value)
      return 0
    }
    return items.value.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0)
  })

  const apiCall = async (method, url, data = null) => {
    try {
      loading.value = true
      error.value = null
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('請先登入')
      }
      
      const config = {
        method,
        url: `${API_BASE_URL}/api/cart${url}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
      
      if (data) {
        config.data = data
      }
      
      console.log(`🔄 API 請求: ${method} ${config.url}`)
      const response = await axios(config)
      console.log(`✅ API 響應:`, response.data)
      
      return response.data
      
    } catch (err) {
      console.error(`❌ API 錯誤:`, err)
      
      let errorMessage = '請求失敗'
      
      if (err.response) {
        const { status, data } = err.response
        switch (status) {
          case 401:
            errorMessage = '登入已過期，請重新登入'
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            break
          case 403:
            errorMessage = '權限不足'
            break
          case 404:
            errorMessage = '找不到請求的資源'
            break
          case 409:
            errorMessage = data?.error || '資料衝突'
            break
          case 500:
            errorMessage = '伺服器內部錯誤'
            break
          default:
            errorMessage = data?.error || `HTTP ${status} 錯誤`
        }
      } else if (err.request) {
        errorMessage = '無法連接到伺服器，請檢查網路連線'
      } else {
        errorMessage = err.message || '未知錯誤'
      }
      
      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const isEventExpired = (event) => {
    if (!event.endDate) return false
    const now = dayjs().tz('Asia/Taipei')
    const endDate = dayjs(event.endDate).tz('Asia/Taipei')
    return endDate.isBefore(now)
  }

  const validateEventData = (event) => {
    const errors = []
    
    if (!event || typeof event !== 'object') {
      errors.push('活動數據無效')
      return { isValid: false, errors }
    }
    
    if (!event.id) errors.push('缺少活動 ID')
    if (!event.name || typeof event.name !== 'string' || event.name.trim().length === 0) {
      errors.push('活動名稱無效')
    }
    
    if (event.price === undefined || event.price === null) {
      errors.push('缺少活動價格')
    } else if (isNaN(Number(event.price)) || Number(event.price) < 0) {
      errors.push('活動價格格式錯誤')
    }
    
    return { isValid: errors.length === 0, errors }
  }

  const standardizeItemData = (item) => {
    return {
      id: String(item.id),
      name: String(item.name).trim(),
      price: Number(item.price),
      image: item.imageUrl || item.image || null,
      quantity: 1,
      barName: item.barName ? String(item.barName).trim() : '',
      location: item.location ? String(item.location).trim() : '',
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      hostUser: item.hostUser || null,
      maxPeople: item.maxPeople || null,
      addedAt: dayjs().tz('Asia/Taipei').toISOString()
    }
  }

  const addItemLocally = (item) => {
    const existing = items.value.find((i) => String(i.id) === String(item.id))
    if (existing) {
      throw new Error('該活動已在購物車中')
    }
    
    const standardizedItem = standardizeItemData(item)
    
    const validation = validateEventData(standardizedItem)
    if (!validation.isValid) {
      throw new Error(`商品數據無效: ${validation.errors.join(', ')}`)
    }
    
    if (isEventExpired(standardizedItem)) {
      throw new Error('該活動已過期，無法加入購物車')
    }
    
    items.value.push(standardizedItem)
    
    localStorage.setItem('joinbar-cart', JSON.stringify(items.value))
    
    console.log('✅ 商品已加入本地購物車:', standardizedItem.name)
    
    return {
      success: true,
      message: '活動已加入購物車',
      item: standardizedItem
    }
  }

  const removeItemLocally = (id) => {
    const index = items.value.findIndex((i) => String(i.id) === String(id))
    if (index !== -1) {
      const removedItem = items.value.splice(index, 1)[0]
      
      localStorage.setItem('joinbar-cart', JSON.stringify(items.value))
      
      console.log('✅ 商品已從本地購物車移除:', removedItem.name)
      
      return {
        success: true,
        message: `已移除「${removedItem.name}」`,
        item: removedItem
      }
    } else {
      return {
        success: false,
        message: '找不到該商品'
      }
    }
  }

  const clearCartLocally = () => {
    const itemCount = items.value.length
    items.value = []
    
    localStorage.removeItem('joinbar-cart')
    
    console.log(`✅ 本地購物車已清空，移除了 ${itemCount} 個商品`)
    
    return {
      success: true,
      message: `購物車已清空 (${itemCount} 個商品)`,
      removedCount: itemCount
    }
  }

  const loadLocalCart = () => {
    try {
      const saved = localStorage.getItem('joinbar-cart')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          items.value = parsed
          console.log('✅ 載入本地購物車:', items.value.length)
        } else {
          console.warn('⚠️ 本地購物車數據格式錯誤，重置為空陣列')
          items.value = []
          localStorage.removeItem('joinbar-cart')
        }
      } else {
        items.value = []
      }
    } catch (error) {
      console.error('載入本地購物車失敗:', error)
      items.value = []
      localStorage.removeItem('joinbar-cart')
    }
  }

  const loadServerCart = async () => {
    try {
      const response = await apiCall('GET', '/')
      if (response && Array.isArray(response.items)) {
        items.value = response.items
        console.log('✅ 載入服務端購物車成功:', items.value.length)
      } else {
        console.warn('⚠️ 服務端回應格式錯誤，設為空陣列')
        items.value = []
      }
      return response
    } catch (err) {
      console.error('載入服務端購物車失敗:', err)
      items.value = [] 
      throw err
    }
  }

  const addItemToServer = async (item) => {
    try {
      await apiCall('POST', '/add', {
        eventId: item.id
      })
      
      await loadServerCart()
      
      return {
        success: true,
        message: '活動已加入購物車'
      }
    } catch (err) {
      throw err
    }
  }

  const removeItemFromServer = async (eventId) => {
    try {
      await apiCall('DELETE', `/remove/${eventId}`)
      
      items.value = items.value.filter(item => item.eventId !== eventId)
      
      return {
        success: true,
        message: '已從購物車移除'
      }
    } catch (err) {
      throw err
    }
  }

  const clearServerCart = async () => {
    try {
      await apiCall('DELETE', '/clear')
      items.value = []
      return {
        success: true,
        message: '購物車已清空'
      }
    } catch (err) {
      throw err
    }
  }

  const loadCart = async () => {
    if (!Array.isArray(items.value)) {
      items.value = []
    }
    
    if (useServerCart.value) {
      try {
        return await loadServerCart()
      } catch (error) {
        console.warn('服務端購物車載入失敗，降級使用本地購物車:', error.message)
        loadLocalCart()
        throw error
      }
    } else {
      loadLocalCart()
    }
  }

  const addItem = async (item) => {
    if (useServerCart.value) {
      try {
        return await addItemToServer(item)
      } catch (error) {
        console.warn('服務端添加失敗，嘗試本地添加:', error.message)
        if (error.message.includes('網路') || error.message.includes('連接')) {
          return addItemLocally(item)
        }
        throw error
      }
    } else {
      return addItemLocally(item)
    }
  }

  const removeItem = async (id) => {
    if (useServerCart.value) {
      try {
        return await removeItemFromServer(id)
      } catch (error) {
        console.warn('服務端移除失敗，嘗試本地移除:', error.message)
        if (error.message.includes('網路') || error.message.includes('連接')) {
          return removeItemLocally(id)
        }
        throw error
      }
    } else {
      return removeItemLocally(id)
    }
  }

  const clearCart = async () => {
    if (useServerCart.value) {
      try {
        return await clearServerCart()
      } catch (error) {
        console.warn('服務端清空失敗，嘗試本地清空:', error.message)
        if (error.message.includes('網路') || error.message.includes('連接')) {
          return clearCartLocally()
        }
        throw error
      }
    } else {
      return clearCartLocally()
    }
  }

  const isInCart = (id) => {
    if (!Array.isArray(items.value)) {
      return false
    }
    return items.value.some((item) => String(item.id) === String(id) || String(item.eventId) === String(id))
  }

  const getOrderData = (customerInfo, paymentMethod) => {
    if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.email) {
      throw new Error('客戶資訊不完整')
    }

    if (!paymentMethod) {
      throw new Error('請選擇付款方式')
    }

    if (!Array.isArray(items.value) || items.value.length === 0) {
      throw new Error('購物車是空的')
    }

    return {
      items: items.value.map(item => ({
        eventId: String(item.eventId || item.id),
        quantity: 1
      })),
      paymentMethod: paymentMethod
    }
  }

  const getCartSummary = computed(() => ({
    totalItems: itemCount.value,
    totalPrice: totalPrice.value,
    isEmpty: !Array.isArray(items.value) || items.value.length === 0,
    mode: useServerCart.value ? 'server' : 'local'
  }))

  const calcSubtotal = (item) => (item.price * item.quantity).toLocaleString()

  return {
    items,
    loading,
    error,
    itemCount,
    totalPrice,
    getCartSummary,
    useServerCart,
    loadCart,
    addItem,
    removeItem,
    clearCart,
    isInCart,
    getOrderData,
    calcSubtotal
  }
})