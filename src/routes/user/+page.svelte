<script lang="ts">
    import CardList from "$lib/components/CardList.svelte";
    import { SidebarManager, SidebarContent, Button } from "$lib/components/ui";
	import { onMount } from "svelte";
    import Icon from '@iconify/svelte';

    let size = $state({ width: '400px', height: '300px' });
    let sidebarOpen = $state(false);
    let sidebarFullscreen = $state(false);
    let selectedUserId = $state('');

    const updateSize = () => {
        size = {
            width: `${window.innerWidth - 75 - 80}px`,
            height: `${window.innerHeight - 90 - 80}px`
        };
    }

    // Sample user data
    const users = [
        { 
            id: '1', 
            name: '山田 太郎', 
            nameKana: 'やまだ たろう',
            age: 78,
            careLevel: 3,
            room: 'A-101',
            detail: '要介護3、糖尿病の管理が必要' 
        },
        { 
            id: '2', 
            name: '佐藤 花子', 
            nameKana: 'さとう はなこ',
            age: 82,
            careLevel: 2,
            room: 'B-205',
            detail: '要介護2、歩行に介助が必要' 
        },
        { 
            id: '3', 
            name: '鈴木 一郎', 
            nameKana: 'すずき いちろう',
            age: 75,
            careLevel: 1,
            room: 'C-302',
            detail: '要介護1、認知症の初期症状' 
        }
    ];

    let selectedUser = $derived(users.find(u => u.id === selectedUserId));

    // Sidebar levels configuration
    const sidebarLevels = $derived([
        {
            id: 'user-list',
            title: '利用者詳細',
            subtitle: selectedUser?.name || '',
            content: userDetailContent,
            actions: userDetailActions
        },
        {
            id: 'user-detail-expanded',
            title: '詳細情報',
            subtitle: selectedUser?.name || '',
            content: userExpandedContent
        }
    ]);
    let sidebarManager: any;

    function handleUserSelect(user: any) {
        selectedUserId = user.id;
        sidebarOpen = true;
    }

    function handleCloseSidebar() {
        sidebarOpen = false;
        selectedUserId = '';
    }

    function handleToggleFullscreen() {
        sidebarFullscreen = !sidebarFullscreen;
    }

    function showExpandedDetail() {
        sidebarManager?.goToLevel(1);
    }

    onMount(() => {
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => {
            window.removeEventListener('resize', updateSize);
        };
    });
</script>

<div class="w:100% h:100%">
    <CardList
		id="user-list"
		title="利用者一覧"
		icon="material-symbols:person"
		list={users.map(user => ({ 
            name: user.name, 
            detail: user.detail,
            onClick: () => handleUserSelect(user)
        }))}
		bind:size={size}
	/>

    <!-- Sidebar for user details -->
    <SidebarManager
        bind:this={sidebarManager}
        isOpen={sidebarOpen}
        isFullscreen={sidebarFullscreen}
        levels={sidebarLevels}
        width="normal"
        onClose={handleCloseSidebar}
        onToggleFullscreen={handleToggleFullscreen}
    />
</div>

{#snippet userDetailActions()}
    <Button
        variant="ghost"
        size="sm"
        onclick={showExpandedDetail}

    >
        <Icon icon="material-symbols:info" class="w:16px h:16px" />
    </Button>
{/snippet}

{#snippet userDetailContent()}
    {#if selectedUser}
        <div class="p:20px space-y:24px">
            <!-- Basic Info -->
            <section>
                <h3 class="text:16px font:600 text:gray-900 mb:12px">基本情報</h3>
                <div class="space-y:12px">
                    <div class="flex justify:between items:center py:8px border-b:1|solid|gray-100">
                        <span class="text:14px text:gray-600">氏名</span>
                        <span class="text:14px font:500">{selectedUser.name}</span>
                    </div>
                    <div class="flex justify:between items:center py:8px border-b:1|solid|gray-100">
                        <span class="text:14px text:gray-600">フリガナ</span>
                        <span class="text:14px">{selectedUser.nameKana}</span>
                    </div>
                    <div class="flex justify:between items:center py:8px border-b:1|solid|gray-100">
                        <span class="text:14px text:gray-600">年齢</span>
                        <span class="text:14px">{selectedUser.age}歳</span>
                    </div>
                    <div class="flex justify:between items:center py:8px border-b:1|solid|gray-100">
                        <span class="text:14px text:gray-600">要介護度</span>
                        <span class="text:14px font:500 text:blue-600">要介護{selectedUser.careLevel}</span>
                    </div>
                    <div class="flex justify:between items:center py:8px border-b:1|solid|gray-100">
                        <span class="text:14px text:gray-600">居室</span>
                        <span class="text:14px">{selectedUser.room}</span>
                    </div>
                </div>
            </section>

            <!-- Quick Actions -->
            <section>
                <h3 class="text:16px font:600 text:gray-900 mb:12px">クイックアクション</h3>
                <div class="grid grid-cols:2 gap:8px">
                    <Button variant="outline" size="sm" class="justify:start">
                        <Icon icon="material-symbols:edit" class="w:16px h:16px mr:8px" />
                        編集
                    </Button>
                    <Button variant="outline" size="sm" class="justify:start">
                        <Icon icon="material-symbols:medical-services" class="w:16px h:16px mr:8px" />
                        医療情報
                    </Button>
                    <Button variant="outline" size="sm" class="justify:start">
                        <Icon icon="material-symbols:family-restroom" class="w:16px h:16px mr:8px" />
                        家族情報
                    </Button>
                    <Button variant="outline" size="sm" class="justify:start" onclick={showExpandedDetail}>
                        <Icon icon="material-symbols:info" class="w:16px h:16px mr:8px" />
                        詳細表示
                    </Button>
                </div>
            </section>

            <!-- Recent Notes -->
            <section>
                <h3 class="text:16px font:600 text:gray-900 mb:12px">最近のメモ</h3>
                <div class="bg:gray-50 rounded:8px p:16px">
                    <p class="text:14px text:gray-700 leading:relaxed">
                        {selectedUser.detail}
                    </p>
                    <div class="mt:12px text:12px text:gray-500">
                        更新日時: 2024年1月15日 14:30
                    </div>
                </div>
            </section>
        </div>
    {/if}
{/snippet}

{#snippet userExpandedContent()}
    {#if selectedUser}
        <div class="p:20px space-y:32px">
            <!-- Detailed Medical Information -->
            <section>
                <h3 class="text:18px font:600 text:gray-900 mb:16px">医療情報</h3>
                <div class="space-y:16px">
                    <div class="bg:white border:1|solid|gray-200 rounded:8px p:16px">
                        <h4 class="text:14px font:600 text:gray-800 mb:8px">アレルギー</h4>
                        <p class="text:14px text:gray-600">卵、そば</p>
                    </div>
                    <div class="bg:white border:1|solid|gray-200 rounded:8px p:16px">
                        <h4 class="text:14px font:600 text:gray-800 mb:8px">服薬情報</h4>
                        <ul class="text:14px text:gray-600 space-y:4px">
                            <li>• 血圧降下剤（朝・夕）</li>
                            <li>• 糖尿病薬（朝・昼・夕）</li>
                        </ul>
                    </div>
                    <div class="bg:white border:1|solid|gray-200 rounded:8px p:16px">
                        <h4 class="text:14px font:600 text:gray-800 mb:8px">既往歴</h4>
                        <p class="text:14px text:gray-600">高血圧、糖尿病、軽度認知症</p>
                    </div>
                </div>
            </section>

            <!-- Family Information -->
            <section>
                <h3 class="text:18px font:600 text:gray-900 mb:16px">家族情報</h3>
                <div class="space-y:12px">
                    <div class="flex justify:between items:center py:12px border-b:1|solid|gray-100">
                        <div>
                            <div class="text:14px font:500">山田 次郎（長男）</div>
                            <div class="text:12px text:gray-500">緊急連絡先</div>
                        </div>
                        <div class="text:right">
                            <div class="text:14px">090-1234-5678</div>
                            <div class="text:12px text:gray-500">東京都在住</div>
                        </div>
                    </div>
                    <div class="flex justify:between items:center py:12px border-b:1|solid|gray-100">
                        <div>
                            <div class="text:14px font:500">山田 美子（長女）</div>
                            <div class="text:12px text:gray-500">副連絡先</div>
                        </div>
                        <div class="text:right">
                            <div class="text:14px">080-9876-5432</div>
                            <div class="text:12px text:gray-500">神奈川県在住</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Care History -->
            <section>
                <h3 class="text:18px font:600 text:gray-900 mb:16px">ケア履歴</h3>
                <div class="space-y:12px">
                    <div class="bg:blue-50 border-l:4|solid|blue-400 p:16px">
                        <div class="flex justify:between items:start mb:8px">
                            <span class="text:14px font:500 text:blue-800">入浴介助</span>
                            <span class="text:12px text:blue-600">2024/01/15 10:00</span>
                        </div>
                        <p class="text:14px text:blue-700">問題なく入浴完了。皮膚状態良好。</p>
                    </div>
                    <div class="bg:green-50 border-l:4|solid|green-400 p:16px">
                        <div class="flex justify:between items:start mb:8px">
                            <span class="text:14px font:500 text:green-800">食事介助</span>
                            <span class="text:12px text:green-600">2024/01/15 12:00</span>
                        </div>
                        <p class="text:14px text:green-700">昼食完食。水分摂取も十分。</p>
                    </div>
                    <div class="bg:yellow-50 border-l:4|solid|yellow-400 p:16px">
                        <div class="flex justify:between items:start mb:8px">
                            <span class="text:14px font:500 text:yellow-800">バイタルチェック</span>
                            <span class="text:12px text:yellow-600">2024/01/15 14:00</span>
                        </div>
                        <p class="text:14px text:yellow-700">血圧: 130/80, 体温: 36.5°C, 脈拍: 72</p>
                    </div>
                </div>
            </section>
        </div>
    {/if}
{/snippet}