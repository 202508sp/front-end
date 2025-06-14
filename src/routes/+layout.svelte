<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/noto-sans-jp';
	import Icon from '@iconify/svelte';
	import { defaultColor } from '$lib/utils/color';
	import { fly } from 'svelte/transition';

	type Menu = {
		name: string;
		icon: string;
	};

	const menus: Menu[] = [
		{ name: 'ホーム', icon: 'material-symbols:home-rounded' },
		{ name: '利用者', icon: 'material-symbols:person'},
		{ name: '職員', icon: 'material-symbols:person-apron' },
		{ name: 'レポート', icon: 'material-symbols:docs-rounded' },
		{ name: '設定', icon: 'material-symbols:settings' },
		{ name: 'ヘルプ', icon: 'material-symbols:question-mark-rounded' },
	]

	let { children } = $props();

	let date: string = $state("");
	let time: string = $state("");

	let menuOpen: boolean = $state(false);

	$effect(() => {
		const updateTime = () => {
			const now = new Date();
			date = now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' (' + 
				now.toLocaleDateString('ja-JP', { weekday: 'short' }) + ')';
			time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
		};

		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	});
</script>

<main
	class="w:100dvw h:100dvh flex bg:var(--color-background) text:var(--color-text) font:normal"
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
		<div class="w:100% h:100% flex justify-content:space-between align-items:center">
			<div
				class="w:230px h:100% rbr:60px bg:var(--color-secondary) fg:var(--color-text) flex justify-content:end align-items:center pr:50px"
			>
				<div class="w:100% flex flex:column gap:4px text-align:right">
					<p class="text:16pt line-h:1em font:medium">{date}</p>
					<p class="text:34pt line-h:1em font:medium">{time}</p>
				</div>
			</div>
			<div class="h:100% flex justify-content:end align-items:end gap:16px pt:24px pr:20px">
				<button
					class="px:10px py:4px bg:var(--color-secondary) text:var(--color-text) r:8px cursor:pointer"
					onclick={() => {
						alert('ログアウトしました');
					}}
				>
					ログアウト
				</button>
				<div
					class="w:160px h:100% flex b:2px|solid|var(--color-accent-pink)"
				></div>
			</div>
		</div>
		<div class="w:100% h:100% grid-template-cols:90px|1fr grid">
			<div class="w:100% h:100% flex justify-content:center align-items:center pl:15px pt:20px">
				<div class="w:100% h:100% flex flex:col justify-content:start align-items:start gap:10px">
					<button
						onclick={() => (menuOpen = !menuOpen)}
						class="w:60px h:60px r:full bg:var(--color-secondary) flex justify-content:center align-items:center cursor:pointer"
					>
						<Icon icon="material-symbols:menu-rounded" class="w:40px h:40px fg:var(--color-text)" />
					</button>
					<div class="{menuOpen ? 'w:200px' : 'w:60px'} flex flex:col gap:10px transition:width|.2s|ease-in">
						{#each menus as menu}
							<button
								class="w:100% h:60px rel grid grid-template-cols:60px|1fr justify-content:start align-items:center bg:var(--color-secondary) fg:var(--color-text) r:60px cursor:pointer"
								onclick={() => alert(`メニュー: ${menu.name}`)}
							>
								<div class="w:60px h:60px flex justify-content:center align-items:center">
									<Icon icon={menu.icon} class="w:30px h:30px" />
								</div>
								<div class="abs top:50% translateY(-50%) left:60px">
									{#if menuOpen}
										<span
											transition:fly={{ duration: 200, x: -20 }}
											class="text:16pt font:bold w:110px flex justify-content:center align-items:center"
										>{menu.name}</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>
			<div class="w:100% h:100% p:40px overflow:auto">
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
