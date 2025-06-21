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

export { getAllSubPlans  };

