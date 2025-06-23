import apiClient from '@/api/axios';

const getAllSubPlans  = async() => {
  try {
    const res = await apiClient.get('/sub/allPlans');
    return res.data.subscription;

  }catch (err) {
    console.error('取得訂閱方案失敗:', err);
    throw err;
  }
}

// const cancelPendingOrdersIfAny = async () => {
//   try {
//     const { data } = await apiClient.get('/orders/history')
//     const pendingOrder = data.orders.find(order => order.status === 'pending')

//     if (pendingOrder) {
//       await apiClient.post(`/orders/${pendingOrder.id}/cancel`, {
//         reason: '自動取消未付款訂單'
//       })
//       console.log(`✅ 已自動取消訂單 ${pendingOrder.id}`)
//     }
//   } catch (err) {
//     console.warn('取消訂單失敗（可忽略）', err)
//   }
// }

const createSubscriptionOrder = async (subscriptionType) => {
  try {
    const response = await apiClient.post('/orders/create', {
      
      items: [
        {
          itemType: 2,
          subscriptionType: subscriptionType,
          quantity: 1
        }
      ],
      paymentMethod: 'LINE_PAY'
    });
    console.log('🔍 建立訂單回傳結果:', response.data)

    return response.data.order;


  } catch (err) {
    console.error('建立訂閱訂單失敗:', err);
    throw err;
  }
};

const createLinePayment = async (order) => {
  try {
    const payload = {
      orderId: order.orderId, // 修正這裡
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount),
    };

    const res = await apiClient.post('/linepay/create', payload);

    const { success, data, message } = res.data;

    if (success && data?.paymentUrl) {
      const { paymentUrl, transactionId, expireTime } = data;

      // 記住付款的資訊
      localStorage.setItem('line_transaction_id', transactionId);
      localStorage.setItem('line_expire_time', expireTime);

      // 導向付款頁
      window.location.href = paymentUrl;

      return { transactionId, expireTime };
    } else {
      throw new Error(message || '建立付款請求失敗');
    }
  } catch (err) {
    console.error('建立 LINE Pay 訂單失敗:', err);
    throw err;
  }
};

const confirmLinePayment = async (transactionId, orderId) => {
  try {
    const res = await apiClient.get('/linepay/confirm', {
      params: { transactionId, orderId }
    });

    if (res.data.success === false) {
      throw new Error(res.data.message || '付款確認失敗');
    }

    return res.data;
  } catch (err) {
    console.error('確認付款失敗:', err);
    throw err;
  }
};
  




export { getAllSubPlans, createSubscriptionOrder, createLinePayment, confirmLinePayment };

