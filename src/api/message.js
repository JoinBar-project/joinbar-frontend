import { ref, computed } from 'vue';
import apiMessage from './axios';
import axios from 'axios';
import apiClient from './axios';

const getMessage = async(event) => {
  try{
    const res = await apiClient.get(`/event/${event.id}/messages`);
    return res.data.messages;

  }catch (err) {
    console.error('取得留言時發生錯誤:',err);
  }
}

const createMessage = async(event, content) => {
  
  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    return { error: '留言內容不可為空' };
  }

  if (trimmedContent.length > 200) {
    return { error: '留言長度不得超過 200 字' };
  }

  try{
    const res = await apiClient.post(`/event/${event.id}/messages`,{
      content : trimmedContent,
    })
    return res.data
    
  }catch (err) {
    console.error('新增留言錯誤:', err);
    return { error: '發生錯誤，請稍後再試一次' };
  }
}

export { getMessage, createMessage };