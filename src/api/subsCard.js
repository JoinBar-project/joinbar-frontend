import apiClient from '@/api/axios';
import dayjs from '@/utils/dayjs'

const getAllSubPlans  = async() => {
  try {
    const res = await apiClient.get('/sub/allPlans');
    return res.data.subscription;

  }catch (err) {
    console.error('取得訂閱方案失敗:', err);
    throw err;
  }
}

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
    console.log('建立訂單回傳結果:', response.data)

    return response.data.order;


  } catch (err) {
    console.error('建立訂閱訂單失敗:', err);
    throw err;
  }
};

const getSubOrderDetails  = async (orderId) => {
  try {
    const res = await apiClient.get(`/orders/${orderId}/details`);
    return res.data;
  } catch (err) {
    console.error('取得訂單詳情失敗:', err);
    throw err;
  }
};

const createLinePayment = async (order) => {
  const payload = {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    amount: Number(order.totalAmount),
  };

  const res = await apiClient.post('/linepay/create', payload);

  const { success, data, message } = res.data;

  if (success && data?.paymentUrl) {
    return {
      transactionId: data.transactionId,
      expireTime: data.expireTime,
      paymentUrl: data.paymentUrl
    };
  } else {
    throw new Error(message || '建立付款請求失敗');
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

const checkSubscriptionStatus = async () => {
  try {
    const res = await apiClient.get('/sub/plan')
    const now = dayjs()

    const validSubs = res.data.subscriptions?.filter(sub =>
      sub.status === 1 && dayjs(sub.endAt).isAfter(now)
    )

    return validSubs ?? []
  } catch (err) {
    if (err.response?.status === 404) return null
    console.error('取得訂閱狀態失敗:', err)
    return null
  }
}
  
export { getAllSubPlans, createSubscriptionOrder, getSubOrderDetails , createLinePayment, confirmLinePayment, checkSubscriptionStatus };

