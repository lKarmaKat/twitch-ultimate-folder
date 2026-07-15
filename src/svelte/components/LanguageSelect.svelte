<script>
    // Menu déroulant de langue, calqué sur BarColorSelect.svelte.
    // value = id de langue ('en' | 'fr'), options = [{id, name, flag}], onchange = callback
    let { value = $bindable("en"), options = [], onchange, dark } = $props();

    const uid = $props.id();
    let selected = $derived(options.find(o => o.id === value));

    let triggerEl = $state();
    let menuStyle = $state("");

    function choose(id) {
        value = id;
        onchange?.();
    }

    function positionMenu(e) {
        if (e.newState !== 'open') return;
        const margin = 4;
        const r = triggerEl.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom - margin;
        const spaceAbove = r.top - margin;
        const openUp = spaceBelow < 150 && spaceAbove > spaceBelow;
        const maxHeight = Math.max(80, Math.min(240, openUp ? spaceAbove : spaceBelow));

        menuStyle = openUp
            ? `top:auto; bottom:${window.innerHeight - r.top + margin}px; left:${r.left}px; right:auto; width:${r.width}px; max-height:${maxHeight}px;`
            : `top:${r.bottom + margin}px; bottom:auto; left:${r.left}px; right:auto; width:${r.width}px; max-height:${maxHeight}px;`;
    }
</script>

<div class="custom-select lang-select" class:dark>
    <button type="button" class="trigger" bind:this={triggerEl} popovertarget="menu-{uid}">
        {#if selected}<img class="flag" src={selected.flag} alt="" />{/if}
        <span class="label">{selected ? selected.name : ""}</span>
        <span class="caret">▲</span>
    </button>

    <ul class="menu" popover id="menu-{uid}" style={menuStyle} onbeforetoggle={positionMenu}>
        {#each options as opt}
            <li>
                <button type="button" class="item" class:active={value === opt.id}
                    popovertarget="menu-{uid}" popovertargetaction="hide"
                    onclick={() => choose(opt.id)}>
                    <img class="flag" src={opt.flag} alt="" />
                    <span class="label">{opt.name}</span>
                </button>
            </li>
        {/each}
    </ul>
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
    .lang-select.dark .menu {
        background: #2c2c2e;
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
    .lang-select:has(.menu:popover-open) .caret { transform: rotate(180deg); }

    .menu {
        position: fixed;
        inset: auto;
        overflow-y: auto;
        margin: 0;
        padding: 0.25em;
        list-style: none;
        background: #ffffff;
        color: inherit;
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
