<script lang="ts">
	import type { Snippet } from 'svelte';
	import { depth } from '$lib/layout/modalStack';

	export type ShellProps = { dimmed?: boolean; children: Snippet };
	let { dimmed = false, children }: ShellProps = $props();

	function scaleByDepth(d: number) {
		if (d <= 0) return 1;
		if (d === 1) return 0.94;
		if (d === 2) return 0.92;
		return Math.max(0.9, 0.92 - (d - 2) * 0.01);
	}

	let scale = $state(1);
	$effect(() => {
		const d = depth();
		scale = dimmed ? scaleByDepth(d) : 1;
	});
</script>

<div class="shell" style={'--bg-scale:' + scale + ';' + (dimmed ? '' : '')}>
	{@render children?.()}
</div>

<style>
	.shell {
		min-height: 100dvh;
		transform-origin: center center;
		transition:
			transform 220ms cubic-bezier(0.22, 0.7, 0.23, 0.99),
			filter 220ms ease,
			opacity 220ms ease;
		transform: scale(var(--bg-scale, 1));
		filter: blur(calc((1 - var(--bg-scale, 1)) * 12px)) saturate(0.96);
		opacity: calc(0.96 + (var(--bg-scale, 1) - 0.94) * 0.4);
	}
</style>
