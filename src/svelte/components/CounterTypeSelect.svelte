<script>
    import CounterType from './CounterType.svelte';
    import { _ } from 'svelte-i18n';
    import * as CST from '../../constantes.js'

    let { value = $bindable("") } = $props();

    const LIVE_CHANNELS_IN_LIST = 16; // dummy value for the preview
    const TOTAL_CHANNELS_IN_LIST = 42;

    const uid = $props.id();
    let selected = $derived(CST.COUNTER_TYPE.find(o => o.id === value));

    let triggerEl = $state();
    let menuStyle = $state("");

    function positionMenu(e) {
        if (e.newState !== 'open') return;
        const r = triggerEl.getBoundingClientRect();
        menuStyle = `top:${r.bottom + 2}px; left:${r.left}px; width:${r.width}px;`;
    }
</script>

<div class="custom-select counter-select">
    <button type="button" class="trigger" bind:this={triggerEl} popovertarget="menu-{uid}">
        <span class="preview">
            {#if value !== ""}<CounterType
                                counter={LIVE_CHANNELS_IN_LIST}
                                totalChannels={TOTAL_CHANNELS_IN_LIST}
                                viewerCountType={value} />{/if}
        </span>
        <span class="label">{selected ? $_(selected.name) : $_('common.none')}</span>
        <span class="caret">▲</span>
    </button>

    <ul class="menu" popover id="menu-{uid}" style={menuStyle} onbeforetoggle={positionMenu}>
        <li>
            <button type="button" class="item" class:active={value === ""}
                popovertarget="menu-{uid}" popovertargetaction="hide"
                onclick={() => value = ""}>
                <span class="preview"></span>
                <span class="label">{$_('common.none')}</span>
            </button>
        </li>
        {#each CST.COUNTER_TYPE as opt}
            <li>
                <button type="button" class="item" class:active={value === opt.id}
                    popovertarget="menu-{uid}" popovertargetaction="hide"
                    onclick={() => value = opt.id}>
                    <span class="preview"><CounterType
                                            counter={LIVE_CHANNELS_IN_LIST}
                                            totalChannels={TOTAL_CHANNELS_IN_LIST}
                                            viewerCountType={opt.id} /></span>
                    <span class="label">{$_(opt.name)}</span>
                </button>
            </li>
        {/each}
    </ul>
</div>

<style>
    .counter-select {
        position: relative;
        width: 100%;
        font-size: 1em;
    }
    .trigger {
        display: flex;
        align-items: center;
        gap: 0.5em;
        width: 100%;
        padding: 0.35em 0.6em;
        background: transparent;
        border: 1px solid grey;
        border-radius: 0.4em;
        cursor: pointer;
        text-align: left;
    }
    .caret {
        margin-left: auto;
        transition: transform 0.15s ease;
        color: grey;
        rotate: 180deg;
    }
    .counter-select:has(.menu:popover-open) .caret { transform: rotate(180deg); }

    .menu {
        position: fixed;
        max-height: 240px;
        overflow-y: auto;
        margin: 0;
        padding: 0.25em;
        list-style: none;
        border: 1px solid grey;
        border-radius: 0.4em;
        background: inherit;
        color: inherit;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .item {
        display: flex;
        align-items: center;
        gap: 0.5em;
        width: 100%;
        padding: 0.4em 0.5em;
        background: transparent;
        border: none;
        border-radius: 0.3em;
        cursor: pointer;
        text-align: left;
        color: inherit;
    }
    .item:hover { background: rgba(145, 71, 255, 0.25); }
    .item.active { background: rgba(145, 71, 255, 0.45); }

    .preview {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 3.5em;
        flex-shrink: 0;
        font-size: 0.85em;
    }
    .label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
