export function validateUserProfile(form) {
  const errors = {};

  if (!form.username || form.username.trim() === '') {
    errors.username = '姓名為必填欄位';
  } else if (form.username.length < 2) {
    errors.username = '姓名不可少於 2 個字元';
  } else if (form.username.length > 20) {
    errors.username = '姓名最多為 20 個字元';
  }

  if (form.nickname) {
    if (form.nickname.trim().length === 0) {
      errors.nickname = '暱稱不可只包含空白字元';
    } else if (form.nickname.length > 100) {
      errors.nickname = '暱稱不能超過 100 個字';
    }
  }

  if (form.birthday) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(form.birthday)) {
      errors.birthday = '生日格式錯誤 (YYYY-MM-DD)';
    } else {
      const birthDate = new Date(form.birthday);
      const today = new Date();
      birthDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (birthDate >= today) {
        errors.birthday = '生日必須是過去的日期';
      }
    }
  }

  return errors;
}
