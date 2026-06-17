<script>
    import IconPicker from './icons/IconPicker.svelte';

    // value = id de l'icône ("" = none), options = [{id, name}], onchange = callback
    let { value = $bindable(""), options = [], onchange, darkTheme = true } = $props();

    let open = $state(false);
    let selected = $derived(options.find(o => o.id === value));

    function choose(id) {
        value = id;
        open = false;
        onchange?.();
    }

    // ferme le menu si on clique en dehors
    function onWindowClick(e) {
        if (!e.target.closest('.icon-select')) open = false;
    }
</script>

<svelte:window onclick={onWindowClick} />

<div class="icon-select" class:dark={darkTheme} class:light={!darkTheme}>
    <button type="button" class="trigger" onclick={() => open = !open}>
        <span class="icon-slot">
            {#if value !== ""}<IconPicker iconType={value} />{/if}
        </span>
        <span class="label">{selected ? selected.name : "none"}</span>
        <span class="caret" class:open>▾</span>
    </button>

    {#if open}
        <ul class="menu">
            <li>
                <button type="button" class="item" class:active={value === ""} onclick={() => choose("")}>
                    <span class="icon-slot"></span>
                    <span class="label">none</span>
                </button>
            </li>
            {#each options as opt}
                <li>
                    <button type="button" class="item" class:active={value === opt.id} onclick={() => choose(opt.id)}>
                        <span class="icon-slot"><IconPicker iconType={opt.id} /></span>
                        <span class="label">{opt.name}</span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .icon-select {
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
        background: #1f1f23;
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
    .item:hover { background: rgba(145, 71, 255, 0.25); }   /* violet Twitch */
    .item.active { background: rgba(145, 71, 255, 0.45); }

    .icon-slot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25em;
        height: 1.25em;
        flex-shrink: 0;
    }
    .label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>