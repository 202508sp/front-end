<!--
  利用者リストアイテムコンポーネント
  仮想化リストで使用される個別アイテム
-->
<script lang="ts">
  import type { User } from '$lib/types/user';
  import { formatDate } from '$lib/utils/date';
  import Icon from '@iconify/svelte';

  interface Props {
    /** 利用者データ */
    user: User;
    /** インデックス（仮想化で使用） */
    index?: number;
    /** 選択状態 */
    selected?: boolean;
    /** 選択時のコールバック */
    onSelect?: (user: User) => void;
    /** クラス名 */
    class?: string;
  }

  let {
    user,
    index,
    selected = false,
    onSelect,
    class: className = ''
  }: Props = $props();

  // 年齢計算
  function calculateAge(birthDate: Date): number {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  }

  // 性別表示
  function getGenderLabel(gender: string): string {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      default: return 'その他';
    }
  }

  // クリックハンドラ
  function handleClick() {
    onSelect?.(user);
  }

  // キーボードハンドラ
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }
</script>

<div
  class="user-list-item p:16px border-b:1|solid|gray-200 hover:bg:gray-50 cursor:pointer transition-colors {selected ? 'bg:blue-50 border-l:4|solid|blue-500' : ''} {className}"
  onclick={handleClick}
  onkeydown={handleKeydown}
  role="button"
  tabindex="0"
  data-user-id={user.id}
  data-index={index}
>
  <div class="flex items:center justify:between">
    <div class="flex-1">
      <!-- ヘッダー情報 -->
      <div class="flex items:center gap:12px mb:8px">
        <h3 class="text:lg font:medium text:gray-800">
          {user.name}
        </h3>
        <span class="text:sm text:gray-600">
          ({user.nameKana})
        </span>
        <span class="px:8px py:2px bg:blue-100 text:blue-700 text:xs r:full font:medium">
          要介護{user.careLevel}
        </span>
        {#if !user.isActive}
          <span class="px:8px py:2px bg:gray-100 text:gray-700 text:xs r:full">
            非アクティブ
          </span>
        {/if}
      </div>
      
      <!-- 基本情報 -->
      <div class="grid grid-cols:2 md:grid-cols:4 gap:16px text:sm text:gray-600 mb:8px">
        <div class="flex items:center gap:4px">
          <Icon icon="material-symbols:cake-outline" class="w:14px h:14px text:gray-400" />
          <span class="font:medium">年齢:</span>
          <span>{calculateAge(user.birthDate)}歳</span>
        </div>
        <div class="flex items:center gap:4px">
          <Icon icon="material-symbols:person-outline" class="w:14px h:14px text:gray-400" />
          <span class="font:medium">性別:</span>
          <span>{getGenderLabel(user.gender)}</span>
        </div>
        <div class="flex items:center gap:4px">
          <Icon icon="material-symbols:calendar-today-outline" class="w:14px h:14px text:gray-400" />
          <span class="font:medium">入所日:</span>
          <span>{formatDate(user.admissionDate)}</span>
        </div>
        <div class="flex items:center gap:4px">
          <Icon icon="material-symbols:update" class="w:14px h:14px text:gray-400" />
          <span class="font:medium">更新日:</span>
          <span>{formatDate(user.updatedAt)}</span>
        </div>
      </div>
      
      <!-- 医療情報 -->
      {#if user.medicalInfo.conditions.length > 0}
        <div class="medical-info">
          <div class="flex items:center gap:4px mb:4px">
            <Icon icon="material-symbols:medical-services-outline" class="w:14px h:14px text:orange-500" />
            <span class="text:xs font:medium text:gray-600">医療情報:</span>
          </div>
          <div class="flex flex:wrap gap:4px">
            {#each user.medicalInfo.conditions.slice(0, 3) as condition}
              <span class="px:6px py:1px bg:orange-100 text:orange-700 text:xs r:4px">
                {condition}
              </span>
            {/each}
            {#if user.medicalInfo.conditions.length > 3}
              <span class="text:xs text:gray-500">
                +{user.medicalInfo.conditions.length - 3}件
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- アレルギー情報 -->
      {#if user.medicalInfo.allergies.length > 0}
        <div class="allergy-info mt:8px">
          <div class="flex items:center gap:4px mb:4px">
            <Icon icon="material-symbols:warning-outline" class="w:14px h:14px text:red-500" />
            <span class="text:xs font:medium text:gray-600">アレルギー:</span>
          </div>
          <div class="flex flex:wrap gap:4px">
            {#each user.medicalInfo.allergies.slice(0, 2) as allergy}
              <span class="px:6px py:1px bg:red-100 text:red-700 text:xs r:4px">
                {allergy}
              </span>
            {/each}
            {#if user.medicalInfo.allergies.length > 2}
              <span class="text:xs text:gray-500">
                +{user.medicalInfo.allergies.length - 2}件
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- 緊急連絡先 -->
      {#if user.emergencyContact}
        <div class="emergency-contact mt:8px">
          <div class="flex items:center gap:4px text:xs text:gray-600">
            <Icon icon="material-symbols:contact-phone-outline" class="w:14px h:14px text:gray-400" />
            <span class="font:medium">緊急連絡先:</span>
            <span>{user.emergencyContact.name}</span>
            <span class="text:gray-500">({user.emergencyContact.relationship})</span>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- 右側のアイコン -->
    <div class="flex-shrink:0 ml:16px">
      <Icon 
        icon="material-symbols:chevron-right" 
        class="w:20px h:20px text:gray-400 transition-transform {selected ? 'rotate:90deg' : ''}"
      />
    </div>
  </div>
</div>

<style>
  .user-list-item {
    position: relative;
    transition: all 0.2s ease;
  }

  .user-list-item:hover {
    transform: translateX(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .user-list-item:focus {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }

  .medical-info,
  .allergy-info,
  .emergency-contact {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .user-list-item {
      padding: 12px;
    }

    .grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
</style>