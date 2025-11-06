<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/noto-sans-jp';
	import Icon from '@iconify/svelte';
	import { depth } from '$lib/layout/modalStack';
	import { defaultColor } from '$lib/utils/color';
	import { fly } from 'svelte/transition';
	import { authStore } from '$lib/stores/auth.svelte';
	import UserMenu from '$lib/components/auth/UserMenu.svelte';
	import PermissionGate from '$lib/components/auth/PermissionGate.svelte';

	type Menu = {
		name: string;
		icon: string;
		href: string;
	};

	const menus: Menu[] = [
		{ name: 'ホーム', icon: 'material-symbols:home-rounded', href: '/' },
		{ name: '利用者', icon: 'material-symbols:person', href: 'user' },
		{ name: '職員', icon: 'material-symbols:person-apron', href: 'staff' },
		{ name: '統計', icon: 'material-symbols:analytics', href: 'statistics' },
		{ name: 'レポート', icon: 'material-symbols:docs-rounded', href: 'management' },
		{ name: '設定', icon: 'material-symbols:settings', href: 'settings' },
		{ name: '家族ポータル', icon: 'material-symbols:family-restroom', href: 'family-portal' }
	];

	let { children } = $props();

	let date: string = $state('');
	let time: string = $state('');

	let menuOpen: boolean = $state(false);

	$effect(() => {
		const updateTime = () => {
			const now = new Date();
			date =
				now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
				' (' +
				now.toLocaleDateString('ja-JP', { weekday: 'short' }) +
				')';
			time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
		};

		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	});
</script>

<main
	class="w:100dvw h:100dvh bg:var(--color-background) text:var(--color-text) font:normal flex"
	style="
	--color-primary: {defaultColor.primary};
	--color-secondary: {defaultColor.secondary};
	--color-tertiary: {defaultColor.tertiary};
	--color-accent-pink: {defaultColor.accent.pink};
	--color-accent-green: {defaultColor.accent.green};
	--color-background: {defaultColor.bg};
	--color-text: {defaultColor.text};"
>
	<div class="w:100% h:100% grid-template-rows:90px|1fr grid">
		<div class="w:100% h:100% justify-content:space-between align-items:center flex">
			<div
				class="w:230px h:100% rbr:60px bg:var(--color-text) fg:var(--color-background) justify-content:end align-items:center pr:50px flex"
			>
				<div class="w:100% flex:column gap:4px text-align:right flex">
					<p class="text:16pt line-h:1em font:medium">{date}</p>
					<p class="text:34pt line-h:1em font:medium">{time}</p>
				</div>
			</div>
			<div class="h:100% justify-content:end align-items:end gap:16px pt:24px pr:20px flex">
				{#if authStore.isAuthenticated}
					<UserMenu />
				{:else}
					<a
						href="/login"
						class="px:16px py:8px bg:var(--color-secondary) text:var(--color-text) r:8px cursor:pointer text-decoration:none"
					>
						ログイン
					</a>
				{/if}
				<div class="w:160px h:100% b:2px|solid|var(--color-accent-pink) flex"></div>
			</div>
		</div>
		<div class="w:100% h:100% grid-template-cols:90px|1fr overflow:hidden grid">
			<div
				class="w:100% h:100% justify-content:center align-items:center pl:15px pt:36px z:9999 flex"
			>
				<div class="w:100% h:100% flex:col justify-content:start align-items:start gap:10px flex">
					<div
						class="w:100% display:flex flex:row justify-content:space-between align-items:center"
					>
						<button class="cursor:pointer">
							<Icon icon="material-symbols:arrow-back-rounded" class="w:30px h:30px" />
						</button>
						<button class="cursor:pointer">
							<Icon icon="material-symbols:arrow-forward-rounded" class="w:30px h:30px" />
						</button>
					</div>
					<button
						onclick={() => (menuOpen = !menuOpen)}
						class="w:60px h:60px ml:7.5px r:full bg:var(--color-secondary) justify-content:center align-items:center cursor:pointer flex"
					>
						<Icon icon="material-symbols:menu-rounded" class="w:40px h:40px fg:var(--color-text)" />
					</button>
					<div
						class="flex:col gap:10px ml:7.5px flex"
						style="width: {menuOpen
							? '200px'
							: '60px'}; transition: width .2s ease-in-out; overflow: hidden;"
					>
						{#each menus as menu}
							{#if menu.href === 'family-portal'}
								<PermissionGate allowFamily={true} requireAuth={true}>
									<button
										class="w:100% h:60px rel grid-template-cols:60px|1fr justify-content:start align-items:center bg:var(--color-secondary) fg:var(--color-text) r:60px cursor:pointer grid"
										onclick={() => (window.location.href = menu.href)}
									>
										<div class="w:60px h:60px justify-content:center align-items:center flex">
											<Icon icon={menu.icon} class="w:30px h:30px" />
										</div>
										<div class="abs top:50% translateY(calc(-50%-2px)) left:60px">
											{#if menuOpen}
												<span
													transition:fly={{ duration: 200, x: -20 }}
													class="text:16pt font:bold w:110px justify-content:center align-items:center flex"
													>{menu.name}</span
												>
											{/if}
										</div>
									</button>
								</PermissionGate>
							{:else if menu.href === 'settings'}
								<PermissionGate role="admin">
									<button
										class="w:100% h:60px rel grid-template-cols:60px|1fr justify-content:start align-items:center bg:var(--color-secondary) fg:var(--color-text) r:60px cursor:pointer grid"
										onclick={() => (window.location.href = menu.href)}
									>
										<div class="w:60px h:60px justify-content:center align-items:center flex">
											<Icon icon={menu.icon} class="w:30px h:30px" />
										</div>
										<div class="abs top:50% translateY(calc(-50%-2px)) left:60px">
											{#if menuOpen}
												<span
													transition:fly={{ duration: 200, x: -20 }}
													class="text:16pt font:bold w:110px justify-content:center align-items:center flex"
													>{menu.name}</span
												>
											{/if}
										</div>
									</button>
								</PermissionGate>
							{:else if menu.href === 'user'}
								<PermissionGate permission="user.read">
									<button
										class="w:100% h:60px rel grid-template-cols:60px|1fr justify-content:start align-items:center bg:var(--color-secondary) fg:var(--color-text) r:60px cursor:pointer grid"
										onclick={() => (window.location.href = menu.href)}
									>
										<div class="w:60px h:60px justify-content:center align-items:center flex">
											<Icon icon={menu.icon} class="w:30px h:30px" />
										</div>
										<div class="abs top:50% translateY(calc(-50%-2px)) left:60px">
											{#if menuOpen}
												<span
													transition:fly={{ duration: 200, x: -20 }}
													class="text:16pt font:bold w:110px justify-content:center align-items:center flex"
													>{menu.name}</span
												>
											{/if}
										</div>
									</button>
								</PermissionGate>
							{:else if menu.href === 'staff'}
								<PermissionGate permission="staff.read">
									<button
										class="w:100% h:60px rel grid-template-cols:60px|1fr justify-content:start align-items:center bg:var(--color-secondary) fg:var(--color-text) r:60px cursor:pointer grid"
										onclick={() => (window.location.href = menu.href)}
									>
										<div class="w:60px h:60px justify-content:center align-items:center flex">
											<Icon icon={menu.icon} class="w:30px h:30px" />
										</div>
										<div class="abs top:50% translateY(calc(-50%-2px)) left:60px">
											{#if menuOpen}
												<span
													transition:fly={{ duration: 200, x: -20 }}
													class="text:16pt font:bold w:110px justify-content:center align-items:center flex"
													>{menu.name}</span
												>
											{/if}
										</div>
									</button>
								</PermissionGate>
							{:else}
								<button
									class="w:100% h:60px rel grid-template-cols:60px|1fr justify-content:start align-items:center bg:var(--color-secondary) fg:var(--color-text) r:60px cursor:pointer grid"
									onclick={() => (window.location.href = menu.href)}
								>
									<div class="w:60px h:60px justify-content:center align-items:center flex">
										<Icon icon={menu.icon} class="w:30px h:30px" />
									</div>
									<div class="abs top:50% translateY(calc(-50%-2px)) left:60px">
										{#if menuOpen}
											<span
												transition:fly={{ duration: 200, x: -20 }}
												class="text:16pt font:bold w:110px justify-content:center align-items:center flex"
												>{menu.name}</span
											>
										{/if}
									</div>
								</button>
							{/if}
						{/each}
					</div>
				</div>
			</div>
			<div class="w:100% h:100% p:40px overflow:auto flex">
				{@render children()}
			</div>
		</div>
	</div>
</main>

<style>
	:global(body) {
		font-family: 'Noto Sans JP', sans-serif;
	}
</style>
