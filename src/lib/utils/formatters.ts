/**
 * フォーマッターユーティリティ
 */

/**
 * 数値を日本語の通貨形式でフォーマット
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
}

/**
 * 数値を3桁区切りでフォーマット
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}

/**
 * パーセンテージをフォーマット
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * ファイルサイズをフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 電話番号をフォーマット（ハイフン付き）
 */
export function formatPhoneNumber(phone: string): string {
  // 数字のみ抽出
  const cleaned = phone.replace(/\D/g, '');
  
  // 携帯電話の場合（11桁）
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  
  // 固定電話の場合（10桁）
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // その他の場合はそのまま返す
  return phone;
}

/**
 * 郵便番号をフォーマット（ハイフン付き）
 */
export function formatPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\D/g, '');
  
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  return postalCode;
}

/**
 * 名前をフォーマット（姓名の間にスペース）
 */
export function formatName(lastName: string, firstName: string): string {
  return `${lastName} ${firstName}`;
}

/**
 * カナ名をフォーマット（姓名の間にスペース）
 */
export function formatKanaName(lastNameKana: string, firstNameKana: string): string {
  return `${lastNameKana} ${firstNameKana}`;
}

/**
 * 性別を日本語でフォーマット
 */
export function formatGender(gender: 'male' | 'female' | 'other'): string {
  const genderMap = {
    male: '男性',
    female: '女性',
    other: 'その他'
  };
  
  return genderMap[gender] || '不明';
}

/**
 * 要介護度をフォーマット
 */
export function formatCareLevel(level: number): string {
  if (level >= 1 && level <= 5) {
    return `要介護${level}`;
  }
  return '不明';
}

/**
 * 職員の役職を日本語でフォーマット
 */
export function formatStaffRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: '管理者',
    manager: 'マネージャー',
    caregiver: '介護士',
    nurse: '看護師',
    therapist: 'セラピスト',
    support: 'サポートスタッフ'
  };
  
  return roleMap[role] || role;
}

/**
 * シフトタイプを日本語でフォーマット
 */
export function formatShiftType(shiftType: string): string {
  const shiftMap: Record<string, string> = {
    day: '日勤',
    evening: '夕勤',
    night: '夜勤',
    'on-call': 'オンコール'
  };
  
  return shiftMap[shiftType] || shiftType;
}

/**
 * レポートタイプを日本語でフォーマット
 */
export function formatReportType(type: string): string {
  const typeMap: Record<string, string> = {
    daily: '日次レポート',
    medical: '医療レポート',
    incident: 'インシデントレポート',
    progress: '経過レポート',
    'family-communication': '家族連絡',
    'monthly-summary': '月次サマリー'
  };
  
  return typeMap[type] || type;
}

/**
 * ステータスを日本語でフォーマット
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'アクティブ',
    inactive: '非アクティブ',
    pending: '保留中',
    approved: '承認済み',
    rejected: '却下',
    draft: '下書き',
    published: '公開済み',
    archived: 'アーカイブ済み'
  };
  
  return statusMap[status] || status;
}

/**
 * 時間の長さをフォーマット（分 → 時間:分）
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}分`;
  } else if (mins === 0) {
    return `${hours}時間`;
  } else {
    return `${hours}時間${mins}分`;
  }
}

/**
 * 住所をフォーマット
 */
export function formatAddress(address: {
  postalCode?: string;
  prefecture?: string;
  city?: string;
  street?: string;
  building?: string;
}): string {
  const parts = [];
  
  if (address.postalCode) {
    parts.push(`〒${formatPostalCode(address.postalCode)}`);
  }
  
  if (address.prefecture) parts.push(address.prefecture);
  if (address.city) parts.push(address.city);
  if (address.street) parts.push(address.street);
  if (address.building) parts.push(address.building);
  
  return parts.join(' ');
}

/**
 * 配列を日本語の区切り文字でフォーマット
 */
export function formatList(items: string[], separator: string = '、'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  
  return items.join(separator);
}

/**
 * テキストを指定文字数で切り詰め
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * HTMLタグを除去
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 改行をHTMLの<br>タグに変換
 */
export function nl2br(text: string): string {
  return text.replace(/\n/g, '<br>');
}

/**
 * URLを検出してリンクに変換
 */
export function linkify(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}