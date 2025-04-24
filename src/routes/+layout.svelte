<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/noto-sans-jp';

	let { children } = $props();
</script>

<main class="w:100dvw h:100dvh flex">
	{@render children()}
</main>

<style>
	:global(body) {
		font-family: 'Noto Sans JP', sans-serif;
	}
</style>
