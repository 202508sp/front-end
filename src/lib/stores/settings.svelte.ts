/**
 * 設定管理ストア
 * Svelte 5 Rune を使用した設定状態管理
 */

import type { 
  SettingsState, 
  SettingGroup, 
  SettingField, 
  FacilitySettings,
  SettingsConfig 
} from '$lib/types/settings';

class SettingsStore {
  // 基本状態
  private _state = $state<SettingsState>({
    config: {
      groups: [],
      version: '1.0.0',
      lastUpdated: new Date()
    },
    currentValues: {},
    originalValues: {},
    isDirty: false,
    isLoading: false,
    isSaving: false,
    errors: {}
  });

  // 派生状態
  get config() { return this._state.config; }
  get currentValues() { return this._state.currentValues; }
  get originalValues() { return this._state.originalValues; }
  get isDirty() { return this._state.isDirty; }
  get isLoading() { return this._state.isLoading; }
  get isSaving() { return this._state.isSaving; }
  get errors() { return this._state.errors; }
  get lastSaved() { return this._state.lastSaved; }

  // 設定グループの取得
  get groups() {
    return this._state.config.groups.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // 特定グループの取得
  getGroup(key: string): SettingGroup | undefined {
    return this._state.config.groups.find(group => group.key === key);
  }

  // 特定フィールドの取得
  getField(key: string): SettingField | undefined {
    for (const group of this._state.config.groups) {
      const field = group.fields.find(f => f.key === key);
      if (field) return field;
    }
    return undefined;
  }

  // フィールド値の取得
  getValue(key: string): any {
    return this._state.currentValues[key];
  }

  // バリデーションエラーの取得
  getError(key: string): string | undefined {
    return this._state.errors[key];
  }

  // 変更があるかチェック
  hasChanges(): boolean {
    return Object.keys(this._state.currentValues).some(key => 
      this._state.currentValues[key] !== this._state.originalValues[key]
    );
  }

  // 設定の初期化
  async initialize(): Promise<void> {
    this._state.isLoading = true;
    this._state.errors = {};

    try {
      // デフォルト設定の生成
      const defaultConfig = this.generateDefaultConfig();
      
      // ローカルストレージから設定を読み込み
      const savedSettings = this.loadFromStorage();
      
      this._state.config = defaultConfig;
      this._state.currentValues = { ...this.getDefaultValues(), ...savedSettings };
      this._state.originalValues = { ...this._state.currentValues };
      this._state.isDirty = false;
      this._state.lastSaved = new Date();
    } catch (error) {
      console.error('設定の初期化に失敗しました:', error);
      this._state.errors.general = '設定の読み込みに失敗しました';
    } finally {
      this._state.isLoading = false;
    }
  }

  // フィールド値の更新
  updateField(key: string, value: any): void {
    const field = this.getField(key);
    if (!field) {
      console.warn(`設定フィールド '${key}' が見つかりません`);
      return;
    }

    // バリデーション
    const error = this.validateField(field, value);
    if (error) {
      this._state.errors[key] = error;
      return;
    } else {
      delete this._state.errors[key];
    }

    // 値の更新
    this._state.currentValues[key] = value;
    this._state.isDirty = this.hasChanges();

    // 即座反映が必要な設定の処理
    this.handleImmediateUpdate(key, value);
  }

  // 設定の保存
  async save(): Promise<void> {
    if (!this._state.isDirty) return;

    this._state.isSaving = true;
    this._state.errors = {};

    try {
      // 全フィールドのバリデーション
      const validationErrors = this.validateAllFields();
      if (Object.keys(validationErrors).length > 0) {
        this._state.errors = validationErrors;
        throw new Error('バリデーションエラーがあります');
      }

      // ローカルストレージに保存
      this.saveToStorage(this._state.currentValues);
      
      // TODO: サーバーへの保存処理を追加
      // await this.saveToServer(this._state.currentValues);

      this._state.originalValues = { ...this._state.currentValues };
      this._state.isDirty = false;
      this._state.lastSaved = new Date();
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      this._state.errors.general = '設定の保存に失敗しました';
      throw error;
    } finally {
      this._state.isSaving = false;
    }
  }

  // 設定のリセット
  async reset(): Promise<void> {
    this._state.isLoading = true;
    
    try {
      const defaultValues = this.getDefaultValues();
      this._state.currentValues = { ...defaultValues };
      this._state.originalValues = { ...defaultValues };
      this._state.isDirty = false;
      this._state.errors = {};
      
      // ローカルストレージをクリア
      this.clearStorage();
      
      // TODO: サーバーの設定もリセット
      // await this.resetOnServer();
      
      this._state.lastSaved = new Date();
    } catch (error) {
      console.error('設定のリセットに失敗しました:', error);
      this._state.errors.general = '設定のリセットに失敗しました';
      throw error;
    } finally {
      this._state.isLoading = false;
    }
  }

  // 変更の破棄
  discardChanges(): void {
    this._state.currentValues = { ...this._state.originalValues };
    this._state.isDirty = false;
    this._state.errors = {};
  }

  // デフォルト設定の生成
  private generateDefaultConfig(): SettingsConfig {
    return {
      version: '1.0.0',
      lastUpdated: new Date(),
      groups: [
        {
          key: 'general',
          label: '一般設定',
          description: 'システム全体の基本設定',
          icon: 'settings',
          order: 1,
          fields: [
            {
              key: 'facility.name',
              label: '施設名',
              description: '介護施設の正式名称',
              type: 'text',
              value: '',
              defaultValue: '',
              required: true,
              validation: { minLength: 1, maxLength: 100 }
            },
            {
              key: 'facility.capacity',
              label: '定員数',
              description: '施設の利用者定員数',
              type: 'number',
              value: 50,
              defaultValue: 50,
              required: true,
              validation: { min: 1, max: 1000 }
            },
            {
              key: 'language',
              label: '言語',
              description: 'システム表示言語',
              type: 'select',
              value: 'ja',
              defaultValue: 'ja',
              options: [
                { value: 'ja', label: '日本語' },
                { value: 'en', label: 'English' }
              ]
            },
            {
              key: 'timezone',
              label: 'タイムゾーン',
              type: 'select',
              value: 'Asia/Tokyo',
              defaultValue: 'Asia/Tokyo',
              options: [
                { value: 'Asia/Tokyo', label: '日本標準時 (JST)' },
                { value: 'UTC', label: '協定世界時 (UTC)' }
              ]
            }
          ]
        },
        {
          key: 'dashboard',
          label: 'ダッシュボード',
          description: 'ダッシュボードの表示設定',
          icon: 'dashboard',
          order: 2,
          fields: [
            {
              key: 'dashboard.allowCustomization',
              label: 'カスタマイズ許可',
              description: '職員によるダッシュボードカスタマイズを許可',
              type: 'boolean',
              value: true,
              defaultValue: true
            },
            {
              key: 'dashboard.refreshInterval',
              label: '自動更新間隔（秒）',
              description: 'ダッシュボードデータの自動更新間隔',
              type: 'number',
              value: 300,
              defaultValue: 300,
              validation: { min: 30, max: 3600 }
            },
            {
              key: 'dashboard.maxCardsPerUser',
              label: '最大カード数',
              description: '1人あたりの最大ダッシュボードカード数',
              type: 'number',
              value: 12,
              defaultValue: 12,
              validation: { min: 1, max: 50 }
            }
          ]
        },
        {
          key: 'users',
          label: '利用者管理',
          description: '利用者情報の管理設定',
          icon: 'people',
          order: 3,
          fields: [
            {
              key: 'users.requirePhotoUpload',
              label: '写真アップロード必須',
              description: '利用者登録時の写真アップロードを必須にする',
              type: 'boolean',
              value: false,
              defaultValue: false
            },
            {
              key: 'users.allowFamilyAccess',
              label: '家族アクセス許可',
              description: '家族による利用者情報へのアクセスを許可',
              type: 'boolean',
              value: true,
              defaultValue: true
            },
            {
              key: 'users.autoArchiveInactive',
              label: '非アクティブ利用者の自動アーカイブ',
              description: '一定期間非アクティブな利用者を自動でアーカイブ',
              type: 'boolean',
              value: false,
              defaultValue: false
            },
            {
              key: 'users.inactiveThresholdDays',
              label: '非アクティブ判定日数',
              description: '何日間アクティビティがないと非アクティブとするか',
              type: 'number',
              value: 90,
              defaultValue: 90,
              validation: { min: 1, max: 365 }
            }
          ]
        },
        {
          key: 'notifications',
          label: '通知設定',
          description: '通知機能の設定',
          icon: 'notifications',
          order: 4,
          fields: [
            {
              key: 'notifications.email',
              label: 'メール通知',
              description: 'メールによる通知を有効にする',
              type: 'boolean',
              value: true,
              defaultValue: true
            },
            {
              key: 'notifications.push',
              label: 'プッシュ通知',
              description: 'ブラウザプッシュ通知を有効にする',
              type: 'boolean',
              value: true,
              defaultValue: true
            },
            {
              key: 'notifications.inApp',
              label: 'アプリ内通知',
              description: 'アプリケーション内での通知表示を有効にする',
              type: 'boolean',
              value: true,
              defaultValue: true
            }
          ]
        },
        {
          key: 'security',
          label: 'セキュリティ',
          description: 'セキュリティ関連の設定',
          icon: 'security',
          order: 5,
          fields: [
            {
              key: 'security.sessionTimeoutMinutes',
              label: 'セッションタイムアウト（分）',
              description: '自動ログアウトまでの時間',
              type: 'number',
              value: 480,
              defaultValue: 480,
              validation: { min: 15, max: 1440 }
            },
            {
              key: 'security.requireTwoFactor',
              label: '二要素認証必須',
              description: 'ログイン時の二要素認証を必須にする',
              type: 'boolean',
              value: false,
              defaultValue: false
            },
            {
              key: 'security.passwordMinLength',
              label: 'パスワード最小文字数',
              description: 'パスワードの最小文字数',
              type: 'number',
              value: 8,
              defaultValue: 8,
              validation: { min: 6, max: 128 }
            },
            {
              key: 'security.maxLoginAttempts',
              label: '最大ログイン試行回数',
              description: 'アカウントロックまでの最大試行回数',
              type: 'number',
              value: 5,
              defaultValue: 5,
              validation: { min: 3, max: 10 }
            }
          ]
        }
      ]
    };
  }

  // デフォルト値の取得
  private getDefaultValues(): Record<string, any> {
    const values: Record<string, any> = {};
    
    for (const group of this._state.config.groups) {
      for (const field of group.fields) {
        values[field.key] = field.defaultValue;
      }
    }
    
    return values;
  }

  // フィールドのバリデーション
  private validateField(field: SettingField, value: any): string | null {
    if (!field.validation) return null;

    const validation = field.validation;

    // 必須チェック
    if (field.required && (value === null || value === undefined || value === '')) {
      return `${field.label}は必須項目です`;
    }

    // 型別バリデーション
    switch (field.type) {
      case 'text':
        if (typeof value === 'string') {
          if (validation.minLength && value.length < validation.minLength) {
            return `${field.label}は${validation.minLength}文字以上で入力してください`;
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            return `${field.label}は${validation.maxLength}文字以下で入力してください`;
          }
          if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
            return `${field.label}の形式が正しくありません`;
          }
        }
        break;

      case 'number':
        if (typeof value === 'number') {
          if (validation.min !== undefined && value < validation.min) {
            return `${field.label}は${validation.min}以上で入力してください`;
          }
          if (validation.max !== undefined && value > validation.max) {
            return `${field.label}は${validation.max}以下で入力してください`;
          }
        }
        break;
    }

    // カスタムバリデーション
    if (validation.custom) {
      return validation.custom(value);
    }

    return null;
  }

  // 全フィールドのバリデーション
  private validateAllFields(): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const group of this._state.config.groups) {
      for (const field of group.fields) {
        const value = this._state.currentValues[field.key];
        const error = this.validateField(field, value);
        if (error) {
          errors[field.key] = error;
        }
      }
    }

    return errors;
  }

  // 即座反映処理
  private handleImmediateUpdate(key: string, value: any): void {
    // 特定の設定は即座に反映
    switch (key) {
      case 'language':
        // 言語設定の即座反映
        document.documentElement.lang = value;
        break;
      case 'theme':
        // テーマ設定の即座反映
        document.documentElement.setAttribute('data-theme', value);
        break;
    }
  }

  // ローカルストレージへの保存
  private saveToStorage(values: Record<string, any>): void {
    try {
      localStorage.setItem('care-facility-settings', JSON.stringify(values));
    } catch (error) {
      console.error('ローカルストレージへの保存に失敗しました:', error);
    }
  }

  // ローカルストレージからの読み込み
  private loadFromStorage(): Record<string, any> {
    try {
      const stored = localStorage.getItem('care-facility-settings');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('ローカルストレージからの読み込みに失敗しました:', error);
      return {};
    }
  }

  // ローカルストレージのクリア
  private clearStorage(): void {
    try {
      localStorage.removeItem('care-facility-settings');
    } catch (error) {
      console.error('ローカルストレージのクリアに失敗しました:', error);
    }
  }
}

// シングルトンインスタンス
export const settingsStore = new SettingsStore();