import apiClient from '@/api/axios'

const getUserSubscriptionHistory = async (userId) => {
  try {
    const res = await apiClient.get(`/sub/userSubs/${userId}`)
    console.log(res.data.subscriptions)
    return res.data.subscriptions
  } catch (err) {
    console.error('❌ 查詢使用者訂閱歷史失敗:', err)
    throw err
  }
}

export { getUserSubscriptionHistory };