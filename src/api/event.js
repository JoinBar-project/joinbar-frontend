import apiClient from '@/api/axios';

const getEventById = async (eventId) => {
  try {
    const res = await apiClient.get(`/api/event/${eventId}`);
    console.log('🔥 getEventById 回傳:', res.data)
    console.log('🔥 event.barName:', res.data.event?.barName);

    return res.data;
  } catch (err) {
    console.error('取得活動資料失敗', err);
    throw err;
  }
};

const joinEventById  = async (eventId) => {
  try {
    const res = await apiClient.post(`/api/event/${eventId}/join`);
    return res.data;
  } catch (err) {
    console.error('報名活動失敗', err);
    throw err;
  }
};


export { getEventById,joinEventById };