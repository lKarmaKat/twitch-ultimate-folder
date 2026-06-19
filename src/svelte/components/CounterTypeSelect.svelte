<script>
    import CounterType from './CounterType.svelte';
    import { _ } from 'svelte-i18n';
    import * as CST from '../../constantes.js'

    let { value = $bindable("") } = $props();

    const SAMPLE = 42; // valeur fictive pour l'aperçu

    let open = $state(false);
    let selected = $derived(CST.COUNTER_TYPE.find(o => o.id === value));

    function choose(id) {
        value = id;
        open = false;
    }

    function onWindowClick(e) {
        if (!e.target.closest('.counter-select')) open = false;
    }
</script>

<svelte:window onclick={onWindowClick} />

<div class="custom-select counter-select">
    <button type="button" class="trigger" onclick={() => open = !open}>
        <span class="preview">
            {#if value !== ""}<CounterType counter={SAMPLE} viewerCountType={value} />{/if}
        </span>
        <span class="label">{selected ? $_(selected.name) : $_('common.none')}</span>
        <span class="caret" class:open>▲</span>
    </button>

    {#if open}
        <ul class="menu">
            <li>
                <button type="button" class="item" class:active={value === ""} onclick={() => choose("")}>
                    <span class="preview"></span>
                    <span class="label">{$_('common.none')}</span>
                </button>
            </li>
            {#each CST.COUNTER_TYPE as opt}
                <li>
                    <button type="button" class="item" class:active={value === opt.id} onclick={() => choose(opt.id)}>
                        <span class="preview"><CounterType counter={SAMPLE} viewerCountType={opt.id} /></span>
                        <span class="label">{$_(opt.name)}</span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
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
    .caret.open { transform: rotate(180deg); }

    .menu {
        position: absolute;
        z-index: 10;
        top: calc(100% + 2px);
        left: 0;
        width: 100%;
        max-height: 240px;
        overflow-y: auto;
        margin: 0;
        padding: 0.25em;
        list-style: none;
        border: 1px solid grey;
        border-radius: 0.4em;
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
