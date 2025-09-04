<!-- components/Modal.svelte -->
<svelte:options runes={true} />

<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { pushModal, popModal, depth, topZ } from '$lib/layout/modalStack';

	export type ModalProps = {
		open?: boolean;
		closable?: boolean;
		initialFocus?: string | null;
		ariaLabel?: string | null;
		baseZ?: number;
		children: Snippet;
	};

	let {
		open = $bindable(false),
		closable = true,
		initialFocus = null,
		ariaLabel = null,
		baseZ = 1000,
		children
	}: ModalProps = $props();

	let dialog: HTMLDialogElement | null = null;
	let entryId: number | null = null;

	// 自分の z-index（深度に応じて変わる）。表示時に評価。
	let zIndex = $state(baseZ);

	// 表示・非表示のライフサイクル
	$effect.pre(() => {
		open;
		untrack(() => {
			if (!dialog) return;
			if (open) {
				if (!dialog.open) dialog.showModal();
				// スタックへ登録（自身へフォーカス返却できるよう focusTarget=dialog）
				entryId = pushModal(dialog);
				zIndex = topZ(baseZ);
				queueMicrotask(() => {
					// 初期フォーカス
					if (!dialog) return;
					if (initialFocus) {
						dialog.querySelector<HTMLElement>(initialFocus)?.focus();
					} else {
						const focusable = dialog.querySelector<HTMLElement>(
							"button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
						);
						(focusable ?? dialog).focus();
					}
				});
			} else {
				if (dialog.open) dialog.close();
				if (entryId != null) {
					popModal(entryId);
					entryId = null;
				}
			}
		});
	});

	// 破棄時のクリーンアップ
	$effect(() => {
		return () => {
			if (entryId != null) {
				popModal(entryId);
				entryId = null;
			}
		};
	});

	function onBackdropClick(ev: MouseEvent) {
		if (!closable) return;
		if (ev.target === dialog) {
			open = false;
		}
	}
	function onKeyDown(ev: KeyboardEvent) {
		// 最前面のみ Esc を有効化（深度比較）
		const isTop = depth() > 0 && zIndex === topZ(baseZ);
		if (ev.key === 'Escape') {
			if (!closable || !isTop) {
				ev.preventDefault();
				ev.stopPropagation();
			} else {
				open = false;
			}
		}
	}
	function onCancel(ev: Event) {
		// dialog のデフォ Esc 動作を制御
		const isTop = depth() > 0 && zIndex === topZ(baseZ);
		if (!closable || !isTop) {
			ev.preventDefault();
		} else {
			open = false;
		}
	}

	// 背景縮小の強度を深度から計算（親背景＝アプリシェル用）
	// 深度1: 0.94, 深度2: 0.92, 以降は 0.92 を下限に逓減
	function backgroundScale() {
		const d = depth();
		if (d <= 0) return 1;
		if (d === 1) return 0.94;
		if (d === 2) return 0.92;
		return Math.max(0.9, 0.92 - (d - 2) * 0.01);
	}
</script>

<dialog
    class="ios-modal"
    style={'z-index:' + zIndex}
    bind:this={dialog}
    onclick={onBackdropClick}
    onkeydown={onKeyDown}
    oncancel={onCancel}
    aria-label={ariaLabel}
    aria-modal="true"
>
	<div
		class="modal-panel"
        role="document"
	>
		{@render children?.()}
	</div>
</dialog>

<svelte:window on:toggle={() => {}} />

<style>
	:global(html.modal-open) {
		overflow: hidden;
	}

	dialog.ios-modal {
		border: none;
		padding: 0;
		margin: 0;
		width: 100%;
		height: 100dvh;
		background: transparent;
		display: grid;
		place-items: center;
		opacity: 0;
		transition: opacity 180ms ease;
	}
	dialog[open].ios-modal {
		opacity: 1;
	}

	dialog.ios-modal::backdrop {
		background: rgba(0, 0, 0, 0.24);
		backdrop-filter: blur(2px);
		transition:
			backdrop-filter 180ms ease,
			background 180ms ease;
	}

	.modal-panel {
		width: min(520px, 92vw);
		max-height: 86dvh;
		background: color-mix(in oklab, white 92%, black 8%);
		border-radius: 20px;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.25),
			0 8px 24px rgba(0, 0, 0, 0.18);
		overflow: clip;
		transform: translateY(12px) scale(0.98);
		opacity: 0;
		transition:
			transform 220ms cubic-bezier(0.22, 0.7, 0.23, 0.99),
			opacity 180ms ease;
	}
	dialog[open].ios-modal .modal-panel {
		transform: translateY(0) scale(1);
		opacity: 1;
	}
</style>
