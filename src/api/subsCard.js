import apiClient from '@/api/axios'
import dayjs from '@/utils/dayjs'

const getUserSubscriptionHistory = async (userId) => {
  if (!userId || isNaN(userId)) {
    console.error('userId 不正確:', userId);
    return [];
  }

  try {
    const res = await apiClient.get(`/sub/userSubs/${userId}`);
    console.log(res.data.subscriptions);
    return res.data.subscriptions;
  } catch (err) {
    console.error('查詢使用者訂閱歷史失敗:', err);
  }
}

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

const getOrderHistory = async () => {
  try {
    const res = await apiClient.get('/orders/history');
    return {
      orders: res.data.orders ?? [],
      summary: res.data.summary ?? {}
    };
  } catch (err) {
    if (err.response?.status === 401) return null;
    console.error('取得訂單歷史失敗:', err);
    throw err;
  }
};

const getSubscriptionOrderStatus = async () => {
  try {
    const result = await getOrderHistory();

    if (!result) {
      console.warn('尚未登入或無法取得訂單紀錄');
      return null;
    }

    const orders = result.orders ?? [];
    const pendingOrder = orders.find(order =>
      order.status === 'pending' &&
      order.items.some(item =>
        item.itemType === 2)
    );

    return pendingOrder ?? null;
  } catch (err) {
    console.error('取得訂閱訂單狀態失敗:', err);
    return null;
  }
};


const cancelSubscriptionOrder = async (orderId) => {
  try {
    const res = await apiClient.delete(`/orders/${orderId}`, {
      data: { reason: 'user_cancel_pending_subscription' }
    });
    console.log(`訂閱訂單 ${orderId} 已取消`);
    return res.data;
  } catch (err) {
    console.error('取消訂閱訂單失敗:', err);
    throw err;
  }
};
  
export { getUserSubscriptionHistory, getAllSubPlans, createSubscriptionOrder, getSubOrderDetails, createLinePayment, confirmLinePayment, checkSubscriptionStatus, getOrderHistory, getSubscriptionOrderStatus, cancelSubscriptionOrder };
