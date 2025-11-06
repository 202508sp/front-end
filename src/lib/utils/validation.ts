/**
 * バリデーションユーティリティ
 */

import type { ValidationError } from '../types/common.js';

/**
 * 必須フィールドのバリデーション
 */
export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return {
      field: fieldName,
      message: `${fieldName}は必須です`,
      code: 'required'
    };
  }
  return null;
}

/**
 * 文字列長のバリデーション
 */
export function validateLength(
  value: string, 
  fieldName: string, 
  min?: number, 
  max?: number
): ValidationError | null {
  if (typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName}は文字列である必要があります`,
      code: 'invalid_type'
    };
  }

  if (min !== undefined && value.length < min) {
    return {
      field: fieldName,
      message: `${fieldName}は${min}文字以上である必要があります`,
      code: 'min_length'
    };
  }

  if (max !== undefined && value.length > max) {
    return {
      field: fieldName,
      message: `${fieldName}は${max}文字以下である必要があります`,
      code: 'max_length'
    };
  }

  return null;
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string, fieldName: string = 'メールアドレス'): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      field: fieldName,
      message: `有効な${fieldName}を入力してください`,
      code: 'invalid_email'
    };
  }
  
  return null;
}

/**
 * 電話番号のバリデーション（日本の形式）
 */
export function validatePhoneNumber(phone: string, fieldName: string = '電話番号'): ValidationError | null {
  // ハイフンを除去
  const cleanPhone = phone.replace(/-/g, '');
  
  // 日本の電話番号形式（固定電話・携帯電話）
  const phoneRegex = /^(0[1-9]\d{8,9}|0[5-9]0\d{8})$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return {
      field: fieldName,
      message: `有効な${fieldName}を入力してください`,
      code: 'invalid_phone'
    };
  }
  
  return null;
}

/**
 * 郵便番号のバリデーション（日本の形式）
 */
export function validatePostalCode(postalCode: string, fieldName: string = '郵便番号'): ValidationError | null {
  // ハイフンを除去
  const cleanCode = postalCode.replace(/-/g, '');
  
  // 日本の郵便番号形式（7桁）
  const postalRegex = /^\d{7}$/;
  
  if (!postalRegex.test(cleanCode)) {
    return {
      field: fieldName,
      message: `${fieldName}は7桁の数字で入力してください`,
      code: 'invalid_postal_code'
    };
  }
  
  return null;
}

/**
 * 数値範囲のバリデーション
 */
export function validateRange(
  value: number, 
  fieldName: string, 
  min?: number, 
  max?: number
): ValidationError | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field: fieldName,
      message: `${fieldName}は数値である必要があります`,
      code: 'invalid_number'
    };
  }

  if (min !== undefined && value < min) {
    return {
      field: fieldName,
      message: `${fieldName}は${min}以上である必要があります`,
      code: 'min_value'
    };
  }

  if (max !== undefined && value > max) {
    return {
      field: fieldName,
      message: `${fieldName}は${max}以下である必要があります`,
      code: 'max_value'
    };
  }

  return null;
}

/**
 * 日付のバリデーション
 */
export function validateDate(date: Date | string, fieldName: string): ValidationError | null {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return {
      field: fieldName,
      message: `有効な${fieldName}を入力してください`,
      code: 'invalid_date'
    };
  }
  
  return null;
}

/**
 * 生年月日のバリデーション（現実的な範囲）
 */
export function validateBirthDate(birthDate: Date | string, fieldName: string = '生年月日'): ValidationError | null {
  const dateError = validateDate(birthDate, fieldName);
  if (dateError) return dateError;

  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  const age = today.getFullYear() - d.getFullYear();

  if (age < 0) {
    return {
      field: fieldName,
      message: `${fieldName}は過去の日付である必要があります`,
      code: 'future_date'
    };
  }

  if (age > 150) {
    return {
      field: fieldName,
      message: `${fieldName}が現実的ではありません`,
      code: 'unrealistic_age'
    };
  }

  return null;
}

/**
 * 要介護度のバリデーション
 */
export function validateCareLevel(careLevel: number, fieldName: string = '要介護度'): ValidationError | null {
  return validateRange(careLevel, fieldName, 1, 5);
}

/**
 * パスワードのバリデーション
 */
export function validatePassword(password: string, fieldName: string = 'パスワード'): ValidationError | null {
  const lengthError = validateLength(password, fieldName, 8, 128);
  if (lengthError) return lengthError;

  // 英数字を含む
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
    return {
      field: fieldName,
      message: `${fieldName}は英字と数字を含む必要があります`,
      code: 'weak_password'
    };
  }

  return null;
}

/**
 * ファイルサイズのバリデーション
 */
export function validateFileSize(file: File, maxSizeMB: number, fieldName: string = 'ファイル'): ValidationError | null {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      field: fieldName,
      message: `${fieldName}のサイズは${maxSizeMB}MB以下である必要があります`,
      code: 'file_too_large'
    };
  }
  
  return null;
}

/**
 * ファイル形式のバリデーション
 */
export function validateFileType(
  file: File, 
  allowedTypes: string[], 
  fieldName: string = 'ファイル'
): ValidationError | null {
  if (!allowedTypes.includes(file.type)) {
    return {
      field: fieldName,
      message: `${fieldName}の形式が無効です。許可された形式: ${allowedTypes.join(', ')}`,
      code: 'invalid_file_type'
    };
  }
  
  return null;
}

/**
 * 複数のバリデーションを実行
 */
export function validateFields(validations: (() => ValidationError | null)[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const validation of validations) {
    const error = validation();
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
}

/**
 * フォームデータの一括バリデーション
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ((value: any, fieldName: string) => ValidationError | null)[]>
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      const error = rule(value, field);
      if (error) {
        errors.push(error);
        break; // 最初のエラーで停止
      }
    }
  }
  
  return errors;
}

/**
 * 利用者データの包括的バリデーション
 */
export function validateUserData(user: Partial<import('../types/user.js').User>): ValidationError[] {
  const errors: ValidationError[] = [];

  // 基本情報のバリデーション
  if (!user.name?.trim()) {
    errors.push(validateRequired(user.name, '氏名')!);
  } else {
    const lengthError = validateLength(user.name, '氏名', 1, 100);
    if (lengthError) errors.push(lengthError);
  }

  if (!user.nameKana?.trim()) {
    errors.push(validateRequired(user.nameKana, '氏名（カナ）')!);
  } else {
    const lengthError = validateLength(user.nameKana, '氏名（カナ）', 1, 100);
    if (lengthError) errors.push(lengthError);
    
    // カタカナチェック
    if (!/^[ァ-ヶー\s]+$/.test(user.nameKana)) {
      errors.push({
        field: '氏名（カナ）',
        message: '氏名（カナ）はカタカナで入力してください',
        code: 'invalid_katakana'
      });
    }
  }

  // 生年月日のバリデーション
  if (!user.birthDate) {
    errors.push(validateRequired(user.birthDate, '生年月日')!);
  } else {
    const birthDateError = validateBirthDate(user.birthDate, '生年月日');
    if (birthDateError) errors.push(birthDateError);
  }

  // 性別のバリデーション
  if (!user.gender) {
    errors.push(validateRequired(user.gender, '性別')!);
  } else if (!['male', 'female', 'other'].includes(user.gender)) {
    errors.push({
      field: '性別',
      message: '有効な性別を選択してください',
      code: 'invalid_gender'
    });
  }

  // 要介護度のバリデーション
  if (user.careLevel === undefined || user.careLevel === null) {
    errors.push(validateRequired(user.careLevel, '要介護度')!);
  } else {
    const careLevelError = validateCareLevel(user.careLevel, '要介護度');
    if (careLevelError) errors.push(careLevelError);
  }

  // 入所日のバリデーション
  if (!user.admissionDate) {
    errors.push(validateRequired(user.admissionDate, '入所日')!);
  } else {
    const admissionDateError = validateDate(user.admissionDate, '入所日');
    if (admissionDateError) errors.push(admissionDateError);
    
    // 入所日が生年月日より後かチェック
    if (user.birthDate && user.admissionDate <= user.birthDate) {
      errors.push({
        field: '入所日',
        message: '入所日は生年月日より後の日付である必要があります',
        code: 'invalid_admission_date'
      });
    }
  }

  // 住所のバリデーション
  if (user.address) {
    if (user.address.postalCode) {
      const postalError = validatePostalCode(user.address.postalCode, '郵便番号');
      if (postalError) errors.push(postalError);
    }

    if (!user.address.prefecture?.trim()) {
      errors.push(validateRequired(user.address.prefecture, '都道府県')!);
    }

    if (!user.address.city?.trim()) {
      errors.push(validateRequired(user.address.city, '市区町村')!);
    }

    if (!user.address.street?.trim()) {
      errors.push(validateRequired(user.address.street, '町名・番地')!);
    }
  }

  // 緊急連絡先のバリデーション
  if (user.emergencyContact) {
    if (!user.emergencyContact.name?.trim()) {
      errors.push(validateRequired(user.emergencyContact.name, '緊急連絡先氏名')!);
    }

    if (!user.emergencyContact.relationship?.trim()) {
      errors.push(validateRequired(user.emergencyContact.relationship, '続柄')!);
    }

    if (!user.emergencyContact.phone?.trim()) {
      errors.push(validateRequired(user.emergencyContact.phone, '緊急連絡先電話番号')!);
    } else {
      const phoneError = validatePhoneNumber(user.emergencyContact.phone, '緊急連絡先電話番号');
      if (phoneError) errors.push(phoneError);
    }

    if (user.emergencyContact.email?.trim()) {
      const emailError = validateEmail(user.emergencyContact.email, '緊急連絡先メールアドレス');
      if (emailError) errors.push(emailError);
    }
  }

  // 医療情報のバリデーション
  if (user.medicalInfo) {
    // 身長のバリデーション
    if (user.medicalInfo.height !== undefined && user.medicalInfo.height !== null) {
      const heightError = validateRange(user.medicalInfo.height, '身長', 50, 250);
      if (heightError) errors.push(heightError);
    }

    // 体重のバリデーション
    if (user.medicalInfo.weight !== undefined && user.medicalInfo.weight !== null) {
      const weightError = validateRange(user.medicalInfo.weight, '体重', 20, 200);
      if (weightError) errors.push(weightError);
    }

    // 血液型のバリデーション
    if (user.medicalInfo.bloodType && !['A', 'B', 'AB', 'O'].includes(user.medicalInfo.bloodType)) {
      errors.push({
        field: '血液型',
        message: '有効な血液型を選択してください',
        code: 'invalid_blood_type'
      });
    }

    // 服薬情報のバリデーション
    if (user.medicalInfo.medications) {
      user.medicalInfo.medications.forEach((medication, index) => {
        if (!medication.name?.trim()) {
          errors.push({
            field: `服薬情報[${index + 1}].薬名`,
            message: '薬名は必須です',
            code: 'required'
          });
        }

        if (!medication.dosage?.trim()) {
          errors.push({
            field: `服薬情報[${index + 1}].用量`,
            message: '用量は必須です',
            code: 'required'
          });
        }

        if (!medication.frequency?.trim()) {
          errors.push({
            field: `服薬情報[${index + 1}].服用頻度`,
            message: '服用頻度は必須です',
            code: 'required'
          });
        }

        if (!medication.startDate) {
          errors.push({
            field: `服薬情報[${index + 1}].開始日`,
            message: '開始日は必須です',
            code: 'required'
          });
        }
      });
    }
  }

  // 家族情報のバリデーション
  if (user.familyMembers) {
    user.familyMembers.forEach((member, index) => {
      if (!member.name?.trim()) {
        errors.push({
          field: `家族情報[${index + 1}].氏名`,
          message: '家族の氏名は必須です',
          code: 'required'
        });
      }

      if (!member.relationship?.trim()) {
        errors.push({
          field: `家族情報[${index + 1}].続柄`,
          message: '続柄は必須です',
          code: 'required'
        });
      }

      if (!member.phone?.trim()) {
        errors.push({
          field: `家族情報[${index + 1}].電話番号`,
          message: '電話番号は必須です',
          code: 'required'
        });
      } else {
        const phoneError = validatePhoneNumber(member.phone, `家族情報[${index + 1}].電話番号`);
        if (phoneError) errors.push(phoneError);
      }

      if (member.email?.trim()) {
        const emailError = validateEmail(member.email, `家族情報[${index + 1}].メールアドレス`);
        if (emailError) errors.push(emailError);
      }
    });
  }

  // 記録・メモのバリデーション
  if (user.notes) {
    user.notes.forEach((note, index) => {
      if (!note.content?.trim()) {
        errors.push({
          field: `記録[${index + 1}].内容`,
          message: '記録内容は必須です',
          code: 'required'
        });
      }

      if (!['general', 'medical', 'behavioral', 'family', 'care-plan'].includes(note.category)) {
        errors.push({
          field: `記録[${index + 1}].カテゴリ`,
          message: '有効なカテゴリを選択してください',
          code: 'invalid_category'
        });
      }
    });
  }

  return errors;
}
/*
*
 * 職員データの包括的バリデーション
 */
export function validateStaffData(staff: Partial<import('../types/staff.js').Staff>): ValidationError[] {
  const errors: ValidationError[] = [];

  // 基本情報のバリデーション
  if (!staff.name?.trim()) {
    errors.push(validateRequired(staff.name, '氏名')!);
  } else {
    const lengthError = validateLength(staff.name, '氏名', 1, 100);
    if (lengthError) errors.push(lengthError);
  }

  if (!staff.nameKana?.trim()) {
    errors.push(validateRequired(staff.nameKana, '氏名（カナ）')!);
  } else {
    const lengthError = validateLength(staff.nameKana, '氏名（カナ）', 1, 100);
    if (lengthError) errors.push(lengthError);
    
    // カタカナチェック
    if (!/^[ァ-ヶー\s]+$/.test(staff.nameKana)) {
      errors.push({
        field: '氏名（カナ）',
        message: '氏名（カナ）はカタカナで入力してください',
        code: 'invalid_katakana'
      });
    }
  }

  // メールアドレスのバリデーション
  if (!staff.email?.trim()) {
    errors.push(validateRequired(staff.email, 'メールアドレス')!);
  } else {
    const emailError = validateEmail(staff.email, 'メールアドレス');
    if (emailError) errors.push(emailError);
  }

  // 電話番号のバリデーション
  if (!staff.phone?.trim()) {
    errors.push(validateRequired(staff.phone, '電話番号')!);
  } else {
    const phoneError = validatePhoneNumber(staff.phone, '電話番号');
    if (phoneError) errors.push(phoneError);
  }

  // 役職のバリデーション
  if (!staff.role) {
    errors.push(validateRequired(staff.role, '役職')!);
  } else if (!['admin', 'manager', 'caregiver', 'nurse', 'therapist', 'support'].includes(staff.role)) {
    errors.push({
      field: '役職',
      message: '有効な役職を選択してください',
      code: 'invalid_role'
    });
  }

  // 部署のバリデーション
  if (!staff.department?.trim()) {
    errors.push(validateRequired(staff.department, '部署')!);
  } else {
    const lengthError = validateLength(staff.department, '部署', 1, 100);
    if (lengthError) errors.push(lengthError);
  }

  // 入社日のバリデーション
  if (!staff.hireDate) {
    errors.push(validateRequired(staff.hireDate, '入社日')!);
  } else {
    const hireDateError = validateDate(staff.hireDate, '入社日');
    if (hireDateError) errors.push(hireDateError);
    
    // 入社日が未来でないかチェック
    const today = new Date();
    if (staff.hireDate > today) {
      errors.push({
        field: '入社日',
        message: '入社日は今日以前の日付である必要があります',
        code: 'future_hire_date'
      });
    }
  }

  // 権限のバリデーション
  if (staff.permissions) {
    const validPermissions = [
      'user.read', 'user.write', 'staff.read', 'staff.write', 
      'statistics.read', 'settings.write', 'reports.write', 'family.communicate'
    ];
    
    staff.permissions.forEach((permission, index) => {
      if (!validPermissions.includes(permission)) {
        errors.push({
          field: `権限[${index + 1}]`,
          message: '無効な権限が含まれています',
          code: 'invalid_permission'
        });
      }
    });
  }

  // 資格情報のバリデーション
  if (staff.qualifications) {
    staff.qualifications.forEach((qualification, index) => {
      if (!qualification.name?.trim()) {
        errors.push({
          field: `資格[${index + 1}].名前`,
          message: '資格名は必須です',
          code: 'required'
        });
      }

      if (!qualification.issuer?.trim()) {
        errors.push({
          field: `資格[${index + 1}].発行機関`,
          message: '発行機関は必須です',
          code: 'required'
        });
      }

      if (!qualification.issueDate) {
        errors.push({
          field: `資格[${index + 1}].取得日`,
          message: '取得日は必須です',
          code: 'required'
        });
      } else {
        const issueDateError = validateDate(qualification.issueDate, `資格[${index + 1}].取得日`);
        if (issueDateError) errors.push(issueDateError);
      }

      // 有効期限のバリデーション（設定されている場合）
      if (qualification.expiryDate) {
        const expiryDateError = validateDate(qualification.expiryDate, `資格[${index + 1}].有効期限`);
        if (expiryDateError) errors.push(expiryDateError);
        
        // 有効期限が取得日より後かチェック
        if (qualification.issueDate && qualification.expiryDate <= qualification.issueDate) {
          errors.push({
            field: `資格[${index + 1}].有効期限`,
            message: '有効期限は取得日より後の日付である必要があります',
            code: 'invalid_expiry_date'
          });
        }
      }
    });
  }

  // スケジュール情報のバリデーション
  if (staff.schedule) {
    staff.schedule.forEach((schedule, index) => {
      if (!schedule.date) {
        errors.push({
          field: `スケジュール[${index + 1}].日付`,
          message: '日付は必須です',
          code: 'required'
        });
      } else {
        const dateError = validateDate(schedule.date, `スケジュール[${index + 1}].日付`);
        if (dateError) errors.push(dateError);
      }

      if (!schedule.startTime?.trim()) {
        errors.push({
          field: `スケジュール[${index + 1}].開始時間`,
          message: '開始時間は必須です',
          code: 'required'
        });
      } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(schedule.startTime)) {
        errors.push({
          field: `スケジュール[${index + 1}].開始時間`,
          message: '開始時間は HH:MM 形式で入力してください',
          code: 'invalid_time_format'
        });
      }

      if (!schedule.endTime?.trim()) {
        errors.push({
          field: `スケジュール[${index + 1}].終了時間`,
          message: '終了時間は必須です',
          code: 'required'
        });
      } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(schedule.endTime)) {
        errors.push({
          field: `スケジュール[${index + 1}].終了時間`,
          message: '終了時間は HH:MM 形式で入力してください',
          code: 'invalid_time_format'
        });
      }

      // 開始時間と終了時間の整合性チェック
      if (schedule.startTime && schedule.endTime) {
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        // 夜勤の場合は翌日にまたがることを考慮
        if (schedule.shiftType !== 'night' && startMinutes >= endMinutes) {
          errors.push({
            field: `スケジュール[${index + 1}].時間`,
            message: '終了時間は開始時間より後である必要があります',
            code: 'invalid_time_range'
          });
        }
      }

      if (!schedule.shiftType) {
        errors.push({
          field: `スケジュール[${index + 1}].シフトタイプ`,
          message: 'シフトタイプは必須です',
          code: 'required'
        });
      } else if (!['day', 'evening', 'night', 'on-call'].includes(schedule.shiftType)) {
        errors.push({
          field: `スケジュール[${index + 1}].シフトタイプ`,
          message: '有効なシフトタイプを選択してください',
          code: 'invalid_shift_type'
        });
      }
    });
  }

  return errors;
}
/**

 * カラーコードのバリデーション
 */
export function validateColor(value: string): string | null {
  if (typeof value !== 'string') {
    return 'カラーコードは文字列である必要があります';
  }

  // HEXカラーコードの形式をチェック
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexPattern.test(value)) {
    return '有効なHEXカラーコード（例: #FF0000）を入力してください';
  }

  return null;
}

/**
 * タイムゾーンのバリデーション
 */
export function validateTimezone(value: string): string | null {
  if (typeof value !== 'string') {
    return 'タイムゾーンは文字列である必要があります';
  }

  try {
    // Intl.DateTimeFormatでタイムゾーンの有効性をチェック
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return null;
  } catch (error) {
    return '有効なタイムゾーンを指定してください';
  }
}

/**
 * 言語コードのバリデーション
 */
export function validateLanguage(value: string): string | null {
  const supportedLanguages = ['ja', 'en'];
  
  if (!supportedLanguages.includes(value)) {
    return `サポートされている言語は ${supportedLanguages.join(', ')} です`;
  }

  return null;
}

/**
 * 日付形式のバリデーション
 */
export function validateDateFormat(value: string): string | null {
  const supportedFormats = ['YYYY/MM/DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
  
  if (!supportedFormats.includes(value)) {
    return `サポートされている日付形式は ${supportedFormats.join(', ')} です`;
  }

  return null;
}

/**
 * 時刻形式のバリデーション
 */
export function validateTimeFormat(value: string): string | null {
  const supportedFormats = ['12h', '24h'];
  
  if (!supportedFormats.includes(value)) {
    return `サポートされている時刻形式は ${supportedFormats.join(', ')} です`;
  }

  return null;
}

/**
 * 設定値の汎用バリデーション
 */
export function validateSettingValue(key: string, value: any): string | null {
  switch (key) {
    case 'theme.colors.primary':
    case 'theme.colors.secondary':
      return validateColor(value);
    
    case 'timezone':
      return validateTimezone(value);
    
    case 'language':
      return validateLanguage(value);
    
    case 'dateFormat':
      return validateDateFormat(value);
    
    case 'timeFormat':
      return validateTimeFormat(value);
    
    default:
      return null;
  }
}