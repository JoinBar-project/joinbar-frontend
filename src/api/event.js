import apiClient from '@/api/axios';

const getEventById = async (eventId) => {
  try {
    const res = await apiClient.get(`/event/${eventId}`);
    return res.data; // { event, tags }
  } catch (err) {
    console.error('取得活動資料失敗', err);
    throw err;
  }
};

const joinEventById  = async (eventId) => {
  try {
    const res = await apiClient.post(`/event/${eventId}/join`);
    return res.data;
  } catch (err) {
    console.error('報名活動失敗', err);
    throw err;
  }
};

export { getEventById, joinEventById  };