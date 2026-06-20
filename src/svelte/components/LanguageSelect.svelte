<script>
    // Menu déroulant de langue, calqué sur BarColorSelect.svelte.
    // value = id de langue ('en' | 'fr'), options = [{id, name, flag}], onchange = callback
    let { value = $bindable("en"), options = [], onchange, dark } = $props();

    let open = $state(false);
    let selected = $derived(options.find(o => o.id === value));

    function choose(id) {
        value = id;
        open = false;
        onchange?.();
    }

    function onWindowClick(e) {
        if (!e.target.closest('.lang-select')) open = false;
    }
</script>

<svelte:window onclick={onWindowClick} />

<div class="custom-select lang-select" class:dark>
    <button type="button" class="trigger" onclick={() => open = !open}>
        {#if selected}<img class="flag" src={selected.flag} alt="" />{/if}
        <span class="label">{selected ? selected.name : ""}</span>
        <span class="caret" class:open>▲</span>
    </button>

    {#if open}
        <ul class="menu">
            {#each options as opt}
                <li>
                    <button type="button" class="item" class:active={value === opt.id} onclick={() => choose(opt.id)}>
                        <img class="flag" src={opt.flag} alt="" />
                        <span class="label">{opt.name}</span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .lang-select {
        position: relative;
        width: 100%;
        font-size: 1em;
    }
    .lang-select.dark,
    .lang-select.dark label {
        color: #f2f2f7;
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
        color: inherit;
    }
    .caret {
        margin-left: auto;
        rotate: 180deg;
        color: grey;
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
        background: inherit;
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

    .flag {
        display: inline-block;
        width: 1.4em;
        height: 0.9em;
        object-fit: cover;
        border-radius: 2px;
        flex-shrink: 0;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
    }
    .label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
