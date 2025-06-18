import apiClient from '@/api/axios';

const getSubIdAndCreateBenefit = async () => {

  try{
    const { sub: { id: subId } } = (await apiClient.get('/sub/plan')).data;
    await apiClient.post('/benefit/create', { subId });
  }catch(err){
    console.error(err)
  }
};

export { getSubIdAndCreateBenefit };

