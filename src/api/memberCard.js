import apiClient from '@/api/axios';

const getSubIdAndCreateBenefit = async () => {

  try{
    const { sub: { id: subId } } = (await apiClient.get('/sub/plan')).data;
    await apiClient.post('/benefit/create', { subId });
  }catch(err){
    console.error(err)
  }
};

const getCanUseBenefit = async(status = 1) => {
  try {
    const { benefits: benefitList } = (await apiClient.get('/benefit', {
      params: { status } 
    })).data;

    return benefitList;
  } catch (err) {
    console.error(err);
  }
};

const getOverUseBenefit = async () => {
  let used = [];
  let expired = [];

  try {
    const usedRes = await apiClient.get('/benefit', { params: { status: 2 } });
    used = usedRes.data.benefits || [];
  } catch (err) {
    if (err.response?.status !== 404) console.error(err);
  }

  try {
    const expiredRes = await apiClient.get('/benefit', { params: { status: 3 } });
    expired = expiredRes.data.benefits || [];
  } catch (err) {
    if (err.response?.status !== 404) console.error(err);
  }

  return [...used, ...expired];
};

export { getSubIdAndCreateBenefit, getCanUseBenefit, getOverUseBenefit };
