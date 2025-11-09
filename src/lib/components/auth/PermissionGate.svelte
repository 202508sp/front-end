<script lang="ts">
  import { authStore } from '../../stores/auth.svelte.js';
  import type { Permission, StaffRole } from '../../types/staff.js';
  import type { Snippet } from 'svelte';

  interface Props {
    // 権限ベースの制御
    permission?: Permission;
    permissions?: Permission[]; // AND条件
    anyPermission?: Permission[]; // OR条件
    
    // ロールベースの制御
    role?: StaffRole;
    roles?: StaffRole[]; // OR条件
    minRole?: StaffRole; // 最小権限レベル
    
    // 家族権限
    familyPermission?: string;
    
    // その他の条件
    requireAuth?: boolean;
    allowFamily?: boolean;
    adminOnly?: boolean;
    
    // レンダリング
    children: Snippet;
    fallback?: Snippet;
    
    // デバッグ用
    debug?: boolean;
  }

  let { 
    permission,
    permissions,
    anyPermission,
    role,
    roles,
    minRole,
    familyPermission,
    requireAuth = false,
    allowFamily = false,
    adminOnly = false,
    children,
    fallback,
    debug = false
  }: Props = $props();

  // アクセス権限チェック
  const hasAccess = $derived(() => {
    // 認証チェック
    if (requireAuth && !authStore.isAuthenticated) {
      if (debug) console.log('PermissionGate: 認証が必要');
      return false;
    }

    // 管理者専用チェック
    if (adminOnly && !authStore.isAdmin()) {
      if (debug) console.log('PermissionGate: 管理者権限が必要');
      return false;
    }

    // 職員のみで家族アクセスが許可されていない場合
    if (!allowFamily && authStore.isFamily) {
      if (debug) console.log('PermissionGate: 家族アクセスが許可されていない');
      return false;
    }

    // 家族権限チェック
    if (familyPermission && authStore.isFamily) {
      const hasPermission = authStore.hasFamilyPermission(familyPermission);
      if (debug) console.log('PermissionGate: 家族権限チェック', familyPermission, hasPermission);
      return hasPermission;
    }

    // 職員権限チェック（以下は職員のみ）
    if (!authStore.isStaff) {
      if (debug) console.log('PermissionGate: 職員アカウントが必要');
      return allowFamily; // 家族アクセスが許可されている場合のみ通す
    }

    // 単一権限チェック
    if (permission) {
      const hasPermission = authStore.hasPermission(permission);
      if (debug) console.log('PermissionGate: 単一権限チェック', permission, hasPermission);
      return hasPermission;
    }

    // 複数権限チェック（AND条件）
    if (permissions && permissions.length > 0) {
      const hasAllPermissions = permissions.every(p => authStore.hasPermission(p));
      if (debug) console.log('PermissionGate: 複数権限チェック（AND）', permissions, hasAllPermissions);
      return hasAllPermissions;
    }

    // 複数権限チェック（OR条件）
    if (anyPermission && anyPermission.length > 0) {
      const hasAnyPermission = anyPermission.some(p => authStore.hasPermission(p));
      if (debug) console.log('PermissionGate: 複数権限チェック（OR）', anyPermission, hasAnyPermission);
      return hasAnyPermission;
    }

    // 単一ロールチェック
    if (role) {
      const hasRole = authStore.hasRole(role);
      if (debug) console.log('PermissionGate: 単一ロールチェック', role, hasRole);
      return hasRole;
    }

    // 複数ロールチェック（OR条件）
    if (roles && roles.length > 0) {
      const hasAnyRole = roles.some(r => authStore.hasRole(r));
      if (debug) console.log('PermissionGate: 複数ロールチェック（OR）', roles, hasAnyRole);
      return hasAnyRole;
    }

    // 最小権限レベルチェック
    if (minRole) {
      const userRole = authStore.userRole;
      if (!userRole) {
        if (debug) console.log('PermissionGate: ユーザーロールが未設定');
        return false;
      }
      
      // 権限レベルの比較（簡易実装）
      const roleLevels: Record<StaffRole, number> = {
        'admin': 100,
        'manager': 80,
        'nurse': 60,
        'caregiver': 40,
        'therapist': 40,
        'support': 20
      };
      
      const userLevel = roleLevels[userRole] || 0;
      const requiredLevel = roleLevels[minRole] || 0;
      const hasMinRole = userLevel >= requiredLevel;
      
      if (debug) console.log('PermissionGate: 最小権限レベルチェック', minRole, userRole, hasMinRole);
      return hasMinRole;
    }

    // 条件が指定されていない場合はアクセス許可
    if (debug) console.log('PermissionGate: 条件未指定のためアクセス許可');
    return true;
  });
</script>

{#if hasAccess()}
  {@render children()}
{:else if fallback}
  {@render fallback()}
{/if}