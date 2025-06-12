import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
 const items = ref([])
 
 const itemCount = computed(() => 
   items.value.reduce((total, item) => total + item.quantity, 0)
 )

 const totalPrice = computed(() => 
   items.value.reduce((total, item) => total + (item.price * item.quantity), 0)
 )

 const isEventExpired = (event) => {
   if (!event.endDate) return false
   const now = new Date()
   const endDate = new Date(event.endDate)
   return endDate < now
 }

 const isEventStartingSoon = (event, hoursThreshold = 2) => {
   if (!event.startDate) return false
   const now = new Date()
   const startDate = new Date(event.startDate)
   const timeDiff = startDate.getTime() - now.getTime()
   const hoursDiff = timeDiff / (1000 * 60 * 60)
   return hoursDiff > 0 && hoursDiff <= hoursThreshold
 }

 const isEventTomorrow = (event) => {
   return isEventStartingSoon(event, 24)
 }

 const isEventOngoing = (event) => {
   if (!event.startDate || !event.endDate) return false
   const now = new Date()
   const startDate = new Date(event.startDate)
   const endDate = new Date(event.endDate)
   return now >= startDate && now <= endDate
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
   
   if (event.startDate && event.endDate) {
     const start = new Date(event.startDate)
     const end = new Date(event.endDate)
     if (start >= end) {
       errors.push('活動結束時間必須晚於開始時間')
     }
   }
   
   if (event.barName && typeof event.barName !== 'string') {
     errors.push('酒吧名稱格式錯誤')
   }
   
   return { isValid: errors.length === 0, errors }
 }

 const validatePriceRange = (price) => {
   const numPrice = Number(price)
   const warnings = []
   
   if (numPrice <= 0) {
     warnings.push('價格為 0 或負數')
   } else if (numPrice > 100000) {
     warnings.push('價格異常高昂（超過 $100,000）')
   } else if (numPrice > 50000) {
     warnings.push('價格較高，請確認是否正確')
   }
   
   return { isReasonable: warnings.length === 0, warnings }
 }

 const validateCart = () => {
   const now = new Date()
   const issues = {
     expired: [],
     invalid: [],
     startingSoon: [],
     tomorrow: [],
     priceWarnings: []
   }
   
   items.value.forEach((item, index) => {
     const validation = validateEventData(item)
     if (!validation.isValid) {
       issues.invalid.push({
         item: { id: item.id, name: item.name },
         errors: validation.errors,
         index
       })
       return
     }

     if (isEventExpired(item)) {
       issues.expired.push({
         item: { id: item.id, name: item.name, endDate: item.endDate },
         index
       })
     } else {
       if (isEventStartingSoon(item, 2)) {
         issues.startingSoon.push({
           item: { id: item.id, name: item.name, startDate: item.startDate },
           index
         })
       } else if (isEventTomorrow(item)) {
         issues.tomorrow.push({
           item: { id: item.id, name: item.name, startDate: item.startDate },
           index
         })
       }
     }

     const priceCheck = validatePriceRange(item.price)
     if (!priceCheck.isReasonable) {
       issues.priceWarnings.push({
         item: { id: item.id, name: item.name, price: item.price },
         warnings: priceCheck.warnings,
         index
       })
     }
   })

   return {
     isHealthy: Object.values(issues).every(arr => arr.length === 0),
     issues,
     summary: {
       total: items.value.length,
       expired: issues.expired.length,
       invalid: issues.invalid.length,
       startingSoon: issues.startingSoon.length,
       tomorrow: issues.tomorrow.length,
       priceWarnings: issues.priceWarnings.length
     }
   }
 }

 const cleanExpiredItems = () => {
   const validation = validateCart()
   const toRemove = [...validation.issues.expired, ...validation.issues.invalid]
   
   toRemove.forEach(issue => {
     removeItem(issue.item.id)
   })
   
   return {
     removed: toRemove.length,
     expiredCount: validation.issues.expired.length,
     invalidCount: validation.issues.invalid.length,
     removedItems: toRemove.map(issue => issue.item.name)
   }
 }

 const getCartHealthReport = () => {
   const validation = validateCart()
   const summary = validation.summary
   
   const messages = []
   
   if (summary.expired > 0) {
     messages.push(`${summary.expired} 個活動已過期`)
   }
   
   if (summary.invalid > 0) {
     messages.push(`${summary.invalid} 個商品資料異常`)
   }
   
   if (summary.startingSoon > 0) {
     messages.push(`${summary.startingSoon} 個活動即將開始`)
   }
   
   if (summary.tomorrow > 0) {
     messages.push(`${summary.tomorrow} 個明日活動`)
   }
   
   if (summary.priceWarnings > 0) {
     messages.push(`${summary.priceWarnings} 個商品價格需確認`)
   }
   
   return {
     isHealthy: validation.isHealthy,
     summary,
     issues: validation.issues,
     message: messages.length > 0 ? messages.join('；') : '購物車狀態良好',
     recommendations: getHealthRecommendations(validation.issues)
   }
 }

 const getHealthRecommendations = (issues) => {
   const recommendations = []
   
   if (issues.expired.length > 0) {
     recommendations.push({
       type: 'urgent',
       message: `建議立即移除 ${issues.expired.length} 個過期活動`,
       action: 'remove_expired'
     })
   }
   
   if (issues.startingSoon.length > 0) {
     recommendations.push({
       type: 'warning',
       message: `${issues.startingSoon.length} 個活動即將開始，請儘速完成購買`,
       action: 'checkout_soon'
     })
   }
   
   if (issues.invalid.length > 0) {
     recommendations.push({
       type: 'error',
       message: `${issues.invalid.length} 個商品資料異常，請重新整理頁面`,
       action: 'refresh_page'
     })
   }
   
   return recommendations
 }

 const getItemStatusText = (item) => {
   if (isEventExpired(item)) {
     return { text: '⚠️ 已過期', type: 'expired', color: 'red' }
   }
   
   if (isEventStartingSoon(item, 2)) {
     return { text: '🔥 即將開始', type: 'starting-soon', color: 'orange' }
   }
   
   if (isEventTomorrow(item)) {
     return { text: '📅 明日活動', type: 'tomorrow', color: 'blue' }
   }
   
   if (isEventOngoing(item)) {
     return { text: '🎯 進行中', type: 'ongoing', color: 'green' }
   }
   
   const priceCheck = validatePriceRange(item.price)
   if (!priceCheck.isReasonable) {
     return { text: '💰 價格異常', type: 'price-warning', color: 'yellow' }
   }
   
   return null
 }

 const canCheckoutComputed = computed(() => {
   if (items.value.length === 0) return false
   
   const validation = validateCart()
   
   return validation.issues.expired.length === 0 && 
          validation.issues.invalid.length === 0
 })

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
     addedAt: new Date().toISOString()
   }
 }

 const addItem = (item) => {
   const existing = items.value.find((i) => String(i.id) === String(item.id))
   if (!existing) {
     const standardizedItem = standardizeItemData(item)
     
     const validation = validateEventData(standardizedItem)
     if (!validation.isValid) {
       console.error('商品數據驗證失敗:', validation.errors)
       throw new Error(`商品數據無效: ${validation.errors.join(', ')}`)
     }
     
     if (isEventExpired(standardizedItem)) {
       throw new Error('該活動已過期，無法加入購物車')
     }
     
     items.value.push(standardizedItem)
     console.log('✅ 商品已加入購物車:', standardizedItem.name)
     
     return {
       success: true,
       message: '活動已加入購物車',
       item: standardizedItem,
       status: getItemStatusText(standardizedItem)
     }
   } else {
     console.warn('⚠️ 該活動已在購物車中')
     throw new Error('該活動已在購物車中')
   }
 }

 const removeItem = (id) => {
   const index = items.value.findIndex((i) => String(i.id) === String(id))
   if (index !== -1) {
     const removedItem = items.value.splice(index, 1)[0]
     console.log('✅ 商品已移除:', removedItem.name)
     return {
       success: true,
       message: `已移除「${removedItem.name}」`,
       item: removedItem
     }
   } else {
     console.warn('⚠️ 找不到要移除的商品 ID:', id)
     return {
       success: false,
       message: '找不到該商品'
     }
   }
 }

 const updateQuantity = (id, quantity) => {
   const item = items.value.find((i) => String(i.id) === String(id))
   if (item) {
     if (quantity <= 0) {
       return removeItem(id)
     } else {
       item.quantity = Math.min(quantity, 1)
       console.log('✅ 商品數量已更新:', item.name, '數量:', item.quantity)
       return {
         success: true,
         message: '數量已更新',
         item: item
       }
     }
   } else {
     console.warn('⚠️ 找不到要更新的商品 ID:', id)
     return {
       success: false,
       message: '找不到該商品'
     }
   }
 }

 const clearCart = () => {
   const itemCount = items.value.length
   items.value = []
   console.log(`✅ 購物車已清空，移除了 ${itemCount} 個商品`)
   return {
     success: true,
     message: `購物車已清空 (${itemCount} 個商品)`,
     removedCount: itemCount
   }
 }

 const isInCart = (id) => {
   return items.value.some((item) => String(item.id) === String(id))
 }

 const getOrderData = (customerInfo, paymentMethod) => {
   if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.email) {
     throw new Error('客戶資訊不完整')
   }

   if (!paymentMethod) {
     throw new Error('請選擇付款方式')
   }

   if (items.value.length === 0) {
     throw new Error('購物車是空的')
   }

   return {
     items: items.value.map(item => ({
       eventId: String(item.id),
       quantity: 1
     })),
     paymentMethod: paymentMethod,
     customerName: customerInfo.name.trim(),
     customerPhone: customerInfo.phone.trim(),
     customerEmail: customerInfo.email.trim()
   }
 }

 const getCartSummary = () => {
   const healthReport = getCartHealthReport()
   
   return {
     totalItems: items.value.length,
     totalQuantity: itemCount.value,
     totalPrice: totalPrice.value,
     isEmpty: items.value.length === 0,
     canCheckout: canCheckoutComputed.value,
     health: healthReport,
     items: items.value.map(item => ({
       id: item.id,
       name: item.name,
       price: item.price,
       quantity: item.quantity,
       subtotal: item.price * item.quantity,
       status: getItemStatusText(item)
     }))
   }
 }

 const addMultipleItems = (itemList) => {
   const results = []
   const errors = []

   itemList.forEach(item => {
     try {
       const result = addItem(item)
       results.push(result)
     } catch (error) {
       errors.push({
         item: item,
         error: error.message
       })
     }
   })

   return {
     success: errors.length === 0,
     added: results.length,
     errors: errors,
     results: results
   }
 }

 return { 
   items,
   itemCount,
   totalPrice,
   addItem,
   removeItem,
   updateQuantity,
   clearCart,
   isInCart,
   getOrderData,
   getCartSummary,
   addMultipleItems,
   standardizeItemData,
   isEventExpired,
   isEventStartingSoon,
   isEventTomorrow,
   isEventOngoing,
   validateEventData,
   validatePriceRange,
   validateCart,
   cleanExpiredItems,
   getCartHealthReport,
   getItemStatusText,
   canCheckoutComputed
 }
}, {
 persist: {
   key: 'joinbar-cart',
   storage: localStorage,
   paths: ['items']
 }
})