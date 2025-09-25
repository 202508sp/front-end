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