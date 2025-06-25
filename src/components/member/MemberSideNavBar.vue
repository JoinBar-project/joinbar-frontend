<script setup>
import { ref, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const router = useRouter();

const handleLogout = async () => {
  if(authStore.loginMethod === 'line' ) {
    try {
      const result = await authStore.lineLogout();

      if (result.success) {
        await Swal.fire({
          title: '登出成功！',
          text: '您已安全登出，感謝使用',
          icon: 'success',
          confirmButtonText: '確認',
          timer: 1500,
          timerProgressBar: true
        });
        router.push('/login');
      }
    } catch (error) {
      console.error('登出失敗:', error);
      await Swal.fire({
        title: '登出失敗',
        text: '請稍後再試',
        icon: 'error',
        confirmButtonText: '確認'
      });
    }
  } else {
    try {
      const result = await authStore.logout();

      if (result.success) {
        await Swal.fire({
          title: '登出成功！',
          text: '您已安全登出，感謝使用',
          icon: 'success',
          confirmButtonText: '確認',
          timer: 1500,
          timerProgressBar: true
        });
        router.push('/login');
      }
    } catch (error) {
      console.error('登出失敗:', error);
      await Swal.fire({
        title: '登出失敗',
        text: '請稍後再試',
        icon: 'error',
        confirmButtonText: '確認'
      });
    }
  }
};

const handleAccountDeletion = async () => {
  try {
    console.log('開始會員註銷');

    Swal.fire({
      title: '載入中...',
      text: '正在載入您的帳戶資訊',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    console.log('獲取帳戶資訊');
    const warningResponse = await authStore.getAccountDeletionWarning();
    console.log('回應:', warningResponse);

    if(!warningResponse.success) {
      console.error('調用失敗:', warningResponse.error);
      throw new Error(warningResponse.error || '無法載入帳戶資訊');
    }

    const warningInfo = warningResponse.data;
    console.log('帳戶載入成功:', warningInfo);

    const { value: formData } = await Swal.fire({
      title: '<span style="color: #dc2626; font-weight: bold;">會員註銷確認</span>',
      html: `
        <div style="text-align: left; max-height: 500px; overflow-y: auto;">

          <!-- 重要警告 -->
          <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="color: #dc2626; font-weight: bold; margin: 0 0 12px 0; font-size: 16px;">
              <i class="fas fa-exclamation-triangle"></i> 重要警告
            </h4>
            <p style="margin: 0 0 12px 0; color: #7f1d1d;">此操作將：</p>
            <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
              <li style="margin-bottom: 8px;"><strong>永久刪除</strong>您的所有個人資料</li>
              <li style="margin-bottom: 8px;"><strong>無法恢復</strong>您的帳戶和資料</li>
              <li style="margin-bottom: 8px;"><strong>立即生效</strong>且不可逆轉</li>
              <li style="margin-bottom: 8px;"><strong>清除所有</strong>活動紀錄和收藏</li>
            </ul>
          </div>

          <!-- 帳戶資訊 -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="color: #374151; font-weight: bold; margin: 0 0 12px 0; font-size: 16px;">您的帳戶資訊</h4>
            <div style="font-size: 14px;">
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 500; color: #6b7280;">使用者名稱：</span>
                <span style="margin-left: 8px; color: #111827;">${warningInfo.accountInfo.username}</span>
              </div>
              ${warningInfo.accountInfo.email ? `
                <div style="margin-bottom: 8px;">
                  <span style="font-weight: 500; color: #6b7280;">電子郵件：</span>
                  <span style="margin-left: 8px; color: #111827;">${warningInfo.accountInfo.email}</span>
                </div>
              ` : ''}
              ${warningInfo.accountInfo.lineUserId ? `
                <div style="margin-bottom: 8px;">
                  <span style="font-weight: 500; color: #6b7280;">LINE 帳號：</span>
                  <span style="margin-left: 8px; color: #059669;">已連結</span>
                </div>
              ` : ''}
              <div>
                <span style="font-weight: 500; color: #6b7280;">登入方式：</span>
                <span style="margin-left: 8px; color: #111827;">${warningInfo.accountInfo.providerType === 'email' ? '電子郵件' : 'LINE'}</span>
              </div>
            </div>
          </div>

          <!-- 註銷後果 -->
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h4 style="color: #dc2626; font-weight: bold; margin: 0 0 12px 0; font-size: 16px;">註銷後果</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              ${warningInfo.consequences.map(consequence => `
                <li style="margin-bottom: 6px; color: #7f1d1d;">
                  <i class="fas fa-times-circle" style="color: #dc2626; margin-right: 6px;"></i>
                  ${consequence}
                </li>
              `).join('')}
            </ul>
          </div>

          <div style="border: 2px solid #dc2626; border-radius: 8px; padding: 16px; background: #fffbeb;">
            <h4 style="color: #dc2626; font-weight: bold; margin: 0 0 16px 0; font-size: 16px;">
              <i class="fas fa-shield-alt"></i> 安全驗證
            </h4>
            ${warningInfo.accountInfo.providerType === 'email' ? `
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 6px;">
                  請輸入您的密碼以確認身份 <span style="color: #dc2626;">*</span>
                </label>
                <input
                  id="swal-password"
                  type="password"
                  style="width: 100%; padding: 8px 12px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                  placeholder="請輸入密碼"
                />
              </div>
            ` : ''}
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 6px;">
                請輸入「<span style="color: #dc2626; font-weight: bold;">刪除我的帳戶</span>」以確認 <span style="color: #dc2626;">*</span>
              </label>
              <input
                id="swal-confirm-text"
                type="text"
                style="width: 100%; padding: 8px 12px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                placeholder="刪除我的帳戶"
              />
            </div>
            <div style="display: flex; align-items: flex-start;">
              <input
                id="swal-final-confirm"
                type="checkbox"
                style="margin-top: 4px; margin-right: 8px; width: 16px; height: 16px;"
              />
              <label for="swal-final-confirm" style="font-size: 14px; color: #374151; line-height: 1.4;">
                我了解此操作無法復原，並確認要永久刪除我的帳戶 <span style="color: #dc2626;">*</span>
              </label>
            </div>
          </div>

          <!-- 最終警告 -->
          <div style="background: #7f1d1d; color: white; border-radius: 8px; padding: 12px; margin-top: 20px; text-align: center;">
            <p style="margin: 0; font-weight: bold;">
              <i class="fas fa-exclamation-triangle" style="margin-right: 6px;"></i>
              確認後將立即且永久刪除您的帳戶
            </p>
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-trash-alt"></i> 確認刪除帳戶',
      cancelButtonText: '<i class="fas fa-times"></i> 取消',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      width: '650px',
      preConfirm: () => {
        const password = document.getElementById('swal-password')?.value || '';
        const confirmText = document.getElementById('swal-confirm-text').value;
        const finalConfirm = document.getElementById('swal-final-confirm').checked;

        // 驗證表單
        const needsPassword = warningInfo.accountInfo.providerType === 'email';
        
        if (needsPassword && !password.trim()) {
          Swal.showValidationMessage('請輸入密碼');
          return false;
        }

        if (confirmText !== '刪除我的帳戶') {
          Swal.showValidationMessage('請輸入正確的確認文字：刪除我的帳戶');
          return false;
        }

        if (!finalConfirm) {
          Swal.showValidationMessage('請確認您了解此操作的後果');
          return false;
        }

        return {
          password: needsPassword ? password : undefined,
          confirmText,
          finalConfirm
        };
      }
    });

    if (!formData) {
      return;
    }

    // 執行註銷
    Swal.fire({
      title: '處理中...',
      text: '正在註銷您的帳戶，請稍候',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const deleteData = {
      confirmText: formData.confirmText
    };

    if (formData.password) {
      deleteData.password = formData.password;
    }

    const result = await authStore.deleteAccount(deleteData);
    if (!result.success) {
      throw new Error(result.error || '註銷失敗');
    }

    // 註銷成功
    await Swal.fire({
      title: '帳戶註銷成功',
      html: `
        <div style="text-align: center;">
          <div style="margin-bottom: 20px;">
            <i class="fas fa-check-circle" style="color: #059669; font-size: 48px;"></i>
          </div>
          <p style="margin-bottom: 16px; font-size: 18px; font-weight: 500;">您的帳戶已成功註銷</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px;">感謝您曾經使用我們的服務</p>
            <p style="margin: 0; color: #166534; font-size: 14px;">祝您一切順利！</p>
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonText: '確認',
      confirmButtonColor: '#059669',
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: '400px'
    });

    // 清除登入狀態並導向首頁
    authStore.clearAuthState();
    router.push('/home');
  } catch(err) {
    console.error('註銷過程發生錯誤:', err);
    
    let errorTitle = '註銷失敗';
    let errorMessage = '處理過程發生錯誤，請稍後再試';

    if(err.response?.data) {
      const errorData = err.response.data;
      console.log('錯誤詳情:', errorData);

      if(errorData.details) {
        const validationErrors = errorData.details.map(detail => detail.message).join('、');
        errorMessage = `驗證失敗：${validationErrors}`;
      } else if (errorData.error) {
        errorMessage = errorData.error;

        if(errorMessage.includes('密碼錯誤')) {
          errorTitle = '密碼驗證失敗';
        } else if(errorMessage.includes('確認文字')) {
          errorTitle = '確認文字錯誤';
        } else if(errorMessage.includes('找不到用戶')) {
          errorTitle = '帳戶驗證失敗';
        }
      }
    } else if (err.message) {
      errorMessage = err.message;
    }
    await Swal.fire({
      title: errorTitle,
      text: errorMessage,
      icon: 'error',
      confirmButtonText: '確認',
      confirmButtonColor: '#dc2626'
    });
  }
}

const userId = computed(() => user.value?.id);

const profileLink = computed(() => ({ name: 'MemberProfile', params: { id: userId.value } }));
const eventLink = computed(() => ({ name: 'MemberEventRecords', params: { id: userId.value } }));
const barLink = computed(() => ({ name: 'MemberBarFavorites', params: { id: userId.value } }));
const memberCardLink = computed(() => ({ name: 'MemberCard', params: { id: userId.value } }));
const ordersLink = computed(() => ({ name: 'MemberOrderRecords', params: { id: userId.value } }));

const menuItems = [
  { name: 'profile', label: '會員資料', icon: 'fa-user', to: profileLink },
  { name: 'event', label: '揪團活動紀錄', icon: 'fa-calendar', to: eventLink },
  { name: 'bar', label: '我的酒吧收藏', icon: 'fa-beer-mug-empty', to: barLink },
  { name: 'card', label: '酒友卡', icon: 'fa-id-card', to: memberCardLink },
  { name: 'orders', label: '訂單紀錄', icon: 'fa-receipt', to: ordersLink },
];

const selectedItem = ref('profile');
</script>

<template>
  <nav class="w-56 bg-gray-100 p-6 min-h-screen flex justify-center">
    <ul class="space-y-1 w-full">
      <li v-for="item in menuItems" :key="item.name">
        <RouterLink
          :to="item.to"
          @click="selectedItem = item.name"
          :class="['flex items-center gap-2 p-2 rounded w-full transition',selectedItem === item.name
            ? 'bg-gray-200 text-black scale-[0.98]'
            : 'hover:bg-gray-200 text-gray-700']">
          <i :class="['fa-solid', item.icon, 'w-4']" />
          {{ item.label }}
        </RouterLink>
      </li>

      <li><button @click="handleAccountDeletion"  class="cursor-pointer">會員註銷</button></li>
      <!-- 登出 -->
      <li>
        <button @click="handleLogout" class="flex items-center gap-2 p-2 rounded w-full text-black hover:bg-gray-200 transition cursor-pointer">
          <i class="fa-solid fa-arrow-right-from-bracket w-4" />登出</button>
      </li>
    </ul>
  </nav>
</template>
