import apiClient from '@/api/axios';

const getSubIdAndCreateBenefit = async () => {
  try {
    const { sub: { id: subId } } = (await apiClient.get('/sub/plan')).data;
    await apiClient.post('/benefit/create', { subId });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const getCanUseBenefit = async (status = 1) => {
  try {
    const { benefits: benefitList } = (await apiClient.get('/benefit', {
      params: { status }
    })).data;
    return benefitList || [];
  } catch (err) {
    if (err.response?.status === 404) return [];
    console.error(err);
    return [];
  }
};

const getOverUseBenefit = async () => {
  let used = [];
  let expired = [];

  try {
    const usedBenefit = await apiClient.get('/benefit', { params: { status: 2 } });
    used = usedBenefit.data.benefits || [];
  } catch (err) {
    if (err.response?.status !== 404) console.error(err);
  }

  try {
    const expiredBenefit = await apiClient.get('/benefit', { params: { status: 3 } });
    expired = expiredBenefit.data.benefits || [];
  } catch (err) {
    if (err.response?.status !== 404) console.error(err);
  }

  return [...used, ...expired];
};

const updateBenefitStatus = async ({ benefitId, barId }) => {
  try {
    await apiClient.put('/benefit/status', { benefitId, barId });
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export { getSubIdAndCreateBenefit, getCanUseBenefit, getOverUseBenefit, updateBenefitStatus };