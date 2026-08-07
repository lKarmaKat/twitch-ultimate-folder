<script>
    // Twitch broadcast-language dropdown for the smart-list source rule, modelled
    // on SortSelect.svelte (inherits its theme via the popup's .custom-select rules)
    // with LanguageSelect.svelte's flag rendering. flag is optional per option: many
    // Twitch language codes (zh, ar, asl, other...) have no single national flag.
    let { value = $bindable(null), options = [], placeholder = "", onchange } = $props();

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

<div class="custom-select lang-select">
    <button type="button" class="trigger" bind:this={triggerEl} popovertarget="menu-{uid}">
        {#if selected?.flag}<img class="flag" src={selected.flag} alt="" />{/if}
        <span class="label">{selected ? selected.name : placeholder}</span>
        <span class="caret">▲</span>
    </button>

    <ul class="menu" popover id="menu-{uid}" style={menuStyle} onbeforetoggle={positionMenu}>
        <li>
            <button type="button" class="item" class:active={value === null}
                popovertarget="menu-{uid}" popovertargetaction="hide"
                onclick={() => choose(null)}>
                <span class="label">{placeholder}</span>
            </button>
        </li>
        {#each options as opt (opt.id)}
            <li>
                <button type="button" class="item" class:active={value === opt.id}
                    popovertarget="menu-{uid}" popovertargetaction="hide"
                    onclick={() => choose(opt.id)}>
                    {#if opt.flag}<img class="flag" src={opt.flag} alt="" />{/if}
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
        background: inherit;
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
