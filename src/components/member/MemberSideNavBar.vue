<script setup>
import { ref, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const router = useRouter();

const userId = computed(() => user.value?.id);

const profileLink = computed(() => ({ name: 'MemberProfile', params: { id: userId.value } }));
const barLink = computed(() => ({ name: 'BarFavorites', params: { id: userId.value } }));
const memberCardLink = computed(() => ({ name: 'MemberCard', params: { id: userId.value } }));
const ordersLink = computed(() => ({ name: 'OrderRecords', params: { id: userId.value } }));

const selectedItem = ref('profile');
const expandedEventRecords = ref(null);

const menuItems = [
  { name: 'profile', label: '會員資料', icon: 'fa-user', to: profileLink },
  {
    name: 'event-records',
    label: '揪團活動紀錄',
    icon: 'fa-calendar',
    children: [
      { name: 'published', label: '我發布的活動', icon: 'fa-bullhorn', to: { name: 'PublishedEvents', params: { id: userId.value } } },
      { name: 'joined', label: '我參加的活動', icon: 'fa-calendar-check', to: { name: 'JoinedEvents', params: { id: userId.value } } }
    ]
  },
  { name: 'bar', label: '我的酒吧收藏', icon: 'fa-beer-mug-empty', to: barLink },
  { name: 'card', label: '酒友卡', icon: 'fa-id-card', to: memberCardLink },
  { name: 'orders', label: '訂單紀錄', icon: 'fa-receipt', to: ordersLink }
];

const handleMainMenuClick = (item) => {
  if (item.children) {
    toggleEventRecords(item.name);
  } else {
    selectedItem.value = item.name;
    router.push(item.to.value);
  }
};

const toggleEventRecords = (name) => {
  if (expandedEventRecords.value === name) {
    expandedEventRecords.value = null;
  } else {
    expandedEventRecords.value = name;
  }
};
const handleLogout = async () => {
  if (authStore.loginMethod === 'line') {
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
      title: '<span style="color: #860914; font-weight: 600; font-size: 24px;">帳戶註銷確認</span>',
      html: `
        <div style="text-align: left; max-height: 600px; overflow-y: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

          <!-- 頂部說明 -->
          <div style="background: linear-gradient(135deg,rgb(242, 242, 242) 0%,rgb(240, 240, 240) 100%); border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <div style="width: 48px; height: 48px; background: var(--color-icon-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
              <i class="fas fa-user-minus" style="color:[var(--color-text-unselected)]; font-size: 20px;"></i>
            </div>
            <p style="margin: 0; color:rgb(67, 63, 59); font-size: 14px; line-height: 1.4;">
              我們很遺憾看到您離開，在進行之前請確認以下資訊
            </p>
          </div>

          <!-- 帳戶資訊卡片 -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 12px;"></div>
              <h4 style="color: #1f2937; font-weight: 600; margin: 0; font-size: 16px;">您的帳戶資訊</h4>
            </div>
            <div style="font-size: 14px; line-height: 1.6;">
              <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-weight: 500;">使用者名稱</span>
                <span style="color: #1f2937; font-weight: 500;">${warningInfo.accountInfo.username}</span>
              </div>
              ${warningInfo.accountInfo.email ? `
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                  <span style="color: #64748b; font-weight: 500;">電子郵件</span>
                  <span style="color: #1f2937; font-weight: 500;">${warningInfo.accountInfo.email}</span>
                </div>
              ` : ''}
              ${warningInfo.accountInfo.lineUserId ? `
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                  <span style="color: #64748b; font-weight: 500;">LINE 帳號</span>
                  <span style="color: #10b981; font-weight: 500;">已連結</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b; font-weight: 500;">登入方式</span>
                <span style="color: #1f2937; font-weight: 500;">${warningInfo.accountInfo.providerType === 'email' ? '電子郵件' : 'LINE'}</span>
              </div>
            </div>
          </div>

          <!-- 影響說明 -->
          <div style="background-image: linear-gradient(to right, #ffecd2 0%, #fcb69f 100%); border: 2px solid #fcb69f; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 24px; height: 24px; background: #fda085; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <i class="fas fa-info" style="color: white; font-size: 12px;"></i>
              </div>
              <h4 style="color: #860914; font-weight: 600; margin: 0; font-size: 16px;">註銷後的影響</h4>
            </div>
            <div style="background: rgba(255,255,255,0.7); border-radius: 8px; padding: 16px;">
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                ${warningInfo.consequences.map(consequence => `
                  <li style="margin-bottom: 8px; color: #860914;">
                    ${consequence}
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- 安全驗證區域 -->
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ffc3a0, #ffafbd); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                <i class="fas fa-shield-alt" style="color: white; font-size: 16px;"></i>
              </div>
              <h4 style="color: #1f2937; font-weight: 600; margin: 0; font-size: 18px;">安全驗證</h4>
            </div>
            
            ${warningInfo.accountInfo.providerType === 'email' ? `
              <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 8px; font-size: 14px;">
                  請輸入您的密碼以確認身份 <span style="color: #ef4444;">*</span>
                </label>
                <input
                  id="swal-password"
                  type="password"
                  style="width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; box-sizing: border-box;"
                  placeholder="請輸入密碼"
                  onFocus="this.style.borderColor='#3b82f6'"
                  onBlur="this.style.borderColor='#e2e8f0'"
                />
              </div>
            ` : ''}
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-weight: 500; color: #374151; margin-bottom: 8px; font-size: 14px;">
                請輸入「<span style="color: #860914; font-weight: 600;">刪除我的帳戶</span>」以確認 <span style="color: #ef4444;">*</span>
              </label>
              <input
                id="swal-confirm-text"
                type="text"
                style="width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; box-sizing: border-box;"
                placeholder="刪除我的帳戶"
                onFocus="this.style.borderColor='#3b82f6'"
                onBlur="this.style.borderColor='#e2e8f0'"
              />
            </div>
            
            <div style="display: flex; align-items: flex-start; background: #f8fafc; padding: 16px; border-radius: 8px;">
              <input
                id="swal-final-confirm"
                type="checkbox"
                style="margin-top: 2px; margin-right: 12px; width: 18px; height: 18px; accent-color: #3b82f6;"
              />
              <label for="swal-final-confirm" style="font-size: 14px; color: #374151; line-height: 1.5; cursor: pointer;">
                我了解此操作無法復原，並確認要永久刪除我的帳戶 <span style="color: #ef4444;">*</span>
              </label>
            </div>
          </div>

          <!-- 最終確認 -->
          <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #f87171; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="width: 48px; height: 48px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
              <i class="fas fa-exclamation-triangle" style="color: white; font-size: 20px;"></i>
            </div>
            <p style="margin: 0; font-weight: 600; color: #991b1b; font-size: 16px;">
              確認後將立即且永久刪除您的帳戶
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #7f1d1d;">
              此動作無法復原，請謹慎考慮
            </p>
          </div>
        </div>`,

      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-trash-alt"></i> 確認刪除帳戶',
      cancelButtonText: '<i class="fas fa-times"></i> 取消',
      confirmButtonColor: '#860914',
      cancelButtonColor: '#cec5be',
      width: '680px',
      customClass: {
        popup: 'modern-swal-popup',
        confirmButton: 'modern-swal-confirm',
        cancelButton: 'modern-swal-cancel'
      },
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
      title: '<span style="color: #1f2937; font-weight: 600;">帳戶註銷成功</span>',
      html: `
        <div style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="margin-bottom: 24px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);">
              <i class="fas fa-check" style="color: white; font-size: 32px;"></i>
            </div>
          </div>
          <p style="margin-bottom: 20px; font-size: 20px; font-weight: 600; color: #1f2937;">您的帳戶已成功註銷</p>
          <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #10b981; border-radius: 12px; padding: 20px;">
            <p style="margin: 0 0 12px 0; color: #047857; font-size: 16px; font-weight: 500;">感謝您曾經使用我們的服務</p>
            <p style="margin: 0; color: #047857; font-size: 14px;">祝您一切順利，期待未來再次相見！</p>
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonText: '確認',
      confirmButtonColor: '#10b981',
      allowOutsideClick: false,
      allowEscapeKey: false,
      width: '480px',
      customClass: {
        popup: 'success-swal-popup'
      }
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
      title: `<span style="color: #1f2937; font-weight: 600;">${errorTitle}</span>`,
      html: `
        <div style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 2px solid #f87171; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 24px;"></i>
          </div>
          <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.5;">${errorMessage}</p>
        </div>
      `,
      confirmButtonText: '我知道了',
      confirmButtonColor: '#6b7280',
      width: '420px',
      customClass: {
        popup: 'error-swal-popup'
      }
    });
  }
}
</script>

<template>
  <nav class="flex justify-center w-56 min-h-screen p-6 bg-gray-100">
    <ul class="w-full space-y-1">
      <li v-for="item in menuItems" :key="item.name">
        <!-- 左側選單 -->
        <div
          @click="handleMainMenuClick(item)"
          :class="[
            'flex items-center justify-between p-2 rounded w-full cursor-pointer transition',
            selectedItem === item.name 
            ? 'bg-gray-200 text-black scale-[0.98]' 
            : 'hover:bg-gray-200 text-gray-700'
          ]">
          <div class="flex items-center gap-2">
            <i :class="['fa-solid', item.icon, 'w-4']" />
            <span>{{ item.label }}</span>
          </div>
          <i v-if="item.children"
            :class="['fa-solid fa-caret-down transition-transform duration-200', 
            expandedEventRecords === item.name 
            ? 'rotate-180' 
            : '']" />
        </div>

        <!-- 揪團活動紀錄的子選單 -->
        <div v-if="item.children && expandedEventRecords === item.name" class="px-2 py-2 mt-1 bg-[#e1ac6747] rounded-lg shadow-inner">
          <ul class="space-y-1">
            <li v-for="child in item.children" :key="child.name">
              <RouterLink
                :to="child.to"
                @click="selectedItem = child.name"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-md transition w-full text-sm text-gray-800',
                  selectedItem === child.name 
                  ? 'bg-[#d68c2c47] scale-[0.98] font-medium' 
                  : 'hover:bg-[#e4bc8747]'
                ]">
                <i :class="['fa-solid', child.icon, 'w-4']" />
                <span>{{ child.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </li>

      <li>
        <button @click="handleAccountDeletion"  class="flex items-center w-full gap-2 p-2 text-black transition rounded cursor-pointer hover:bg-gray-200">
          <i class="w-4 fa-solid fa-user-slash" />會員註銷</button>
      </li>
      <!-- 登出 -->
      <li>
        <button @click="handleLogout" class="flex items-center w-full gap-2 p-2 text-black transition rounded cursor-pointer hover:bg-gray-200">
          <i class="w-4 fa-solid fa-arrow-right-from-bracket" />登出</button>
      </li>
    </ul>
  </nav>
</template>
