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
     items.value.push(standardizedItem)
     console.log('✅ 商品已加入購物車:', standardizedItem.name)
     return {
       success: true,
       message: '活動已加入購物車',
       item: standardizedItem
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
   return {
     totalItems: items.value.length,
     totalQuantity: itemCount.value,
     totalPrice: totalPrice.value,
     isEmpty: items.value.length === 0,
     items: items.value.map(item => ({
       id: item.id,
       name: item.name,
       price: item.price,
       quantity: item.quantity,
       subtotal: item.price * item.quantity
     }))
   }
 }

 const validateCart = () => {
   const issues = []
   const now = new Date()

   items.value.forEach((item, index) => {
     if (!item.id || !item.name || typeof item.price !== 'number') {
       issues.push({
         type: 'invalid_data',
         item: item,
         index: index,
         message: '商品資料不完整'
       })
     }

     if (item.endDate && new Date(item.endDate) < now) {
       issues.push({
         type: 'expired',
         item: item,
         index: index,
         message: '活動已過期'
       })
     }

     if (item.price <= 0) {
       issues.push({
         type: 'invalid_price',
         item: item,
         index: index,
         message: '商品價格異常'
       })
     }
   })

   return {
     isValid: issues.length === 0,
     issues: issues,
     summary: {
       total: items.value.length,
       expired: issues.filter(i => i.type === 'expired').length,
       invalid: issues.filter(i => i.type === 'invalid_data').length,
       priceIssues: issues.filter(i => i.type === 'invalid_price').length
     }
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
   validateCart,
   addMultipleItems,
   standardizeItemData
 }
}, {
 persist: {
   key: 'joinbar-cart',
   storage: localStorage,
   paths: ['items']
 }
})