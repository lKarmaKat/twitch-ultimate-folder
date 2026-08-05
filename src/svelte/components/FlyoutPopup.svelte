<script>
	import Display from './Display.svelte';
	import { flyoutState, keepFlyoutOpen, scheduleCloseFlyout, alignmentLeft, skinModern } from '../event.svelte.js';
	import { readTwitchDark, watchTwitchTheme } from '../twitchTheme.js';
	import * as CST from '../../constantes.js';

	let { configManager } = $props();

	const VIEWPORT_MARGIN = 8;

	let theme = $state(readTwitchDark());
	$effect(() => watchTwitchTheme((dark) => { theme = dark; }));

	let open = $derived(!!flyoutState.listId && !!configManager.selectedConfig[flyoutState.listId]);

	let panelHeight = $state(0);
	// The header rect alone would let a list sitting low in the sidebar open a
	// panel running past the bottom edge.
	let top = $derived(Math.max(VIEWPORT_MARGIN,
		Math.min(flyoutState.top, window.innerHeight - panelHeight - VIEWPORT_MARGIN)));
	let left = $derived(flyoutState.side === 'left' ? flyoutState.left : flyoutState.right);

	let barColor = $derived.by(() => {
		const style = configManager.selectedConfig[flyoutState.listId]?.style;
		return CST.THEME_COLOR.find(e => e.id === style?.theme)?.color;
	});

	// getBoundingClientRect() is viewport-relative and stale the moment the
	// sidebar scrolls under it: closing on scroll is simpler than recomputing.
	$effect(() => {
		function onScroll() { flyoutState.listId = null; }
		window.addEventListener('scroll', onScroll, { capture: true, passive: true });
		return () => window.removeEventListener('scroll', onScroll, { capture: true });
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div id="display-container"
		class="flyout-anchor"
		class:dark={theme} class:light={!theme}
		class:al-left={alignmentLeft.current} class:al-right={!alignmentLeft.current}
		class:flip-left={flyoutState.side === 'left'}
		class:skin-modern={skinModern.current}
		style="top:{top}px; left:{left}px; --flyout-width:{CST.FLYOUT_PANEL_WIDTH}px;"
		onmouseenter={keepFlyoutOpen}
		onmouseleave={() => scheduleCloseFlyout(flyoutState.listId)}>
		<div class="flyout-panel" bind:clientHeight={panelHeight} style={barColor ? `border-color:${barColor};` : ''}>
			<Display listId={flyoutState.listId} configManager={configManager} headless={true} />
		</div>
	</div>
{/if}

<style>
	/* The flip offset lives on the anchor itself, not the panel: a
	   transform on a child never moves its untransformed parent's own
	   hit-test box, which would otherwise still cover the header underneath. */
	.flyout-anchor {
		position: fixed;
		z-index: 2147483000;
	}
	.flyout-anchor.flip-left {
		transform: translateX(-100%);
	}
	.flyout-panel {
		width: var(--flyout-width);
		max-height: 70vh;
		overflow-y: auto;
		border-radius: 6px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
		border-right: 3px solid transparent;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color, currentColor) transparent;
	}
	.flyout-panel::-webkit-scrollbar {
		width: 8px;
	}
	.flyout-panel::-webkit-scrollbar-thumb {
		background: var(--scrollbar-color, currentColor);
		border-radius: 4px;
	}
	.flyout-panel::-webkit-scrollbar-thumb:hover {
		background: var(--scrollbar-color-hover, currentColor);
	}
	.flyout-anchor.flip-left .flyout-panel {
		border-right: none;
		border-left: 3px solid transparent;
	}
</style>
