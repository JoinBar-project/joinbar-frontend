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

    return response.data.order;
  } catch (err) {
    console.error('建立訂閱訂單失敗:', err);
    throw err;
  }
};

const createLinePayment = async (order) => {
  try {
    const payload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
    };

    const res = await apiClient.post('/linepay/create', payload)

    const { success, data, message } = res.data;

    if (success && data?.paymentUrl) {
      const { paymentUrl, transactionId, expireTime } = data;

      // 記住付款的資訊
      localStorage.setItem('line_transaction_id', transactionId);
      localStorage.setItem('line_expire_time', expireTime);

      // 導向付款頁
      window.location.href = paymentUrl;

      // LINE Pay 的訂單編號 跟 過期時間
      return { transactionId, expireTime };
    } else {
      throw new Error(message || '建立付款請求失敗');
    }
  } catch (err) {
    console.error('建立 LINE Pay 訂單失敗:', err);
    throw err;
  }
};




export { getAllSubPlans, createSubscriptionOrder, createLinePayment };

