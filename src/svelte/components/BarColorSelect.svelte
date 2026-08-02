<script>
    import { _ } from 'svelte-i18n';
    import * as CST from '../../constantes.js'

    let { value = $bindable("") } = $props();

    const uid = $props.id();
    let selected = $derived(CST.THEME_COLOR.find(o => o.id === value));
    let selectedName = $derived(selected ? $_(selected.name) : $_('common.none'));

    let triggerEl = $state();
    let menuStyle = $state("");
    let hoveredName = $state("");

    function positionMenu(e) {
        if (e.newState !== 'open') return;
        hoveredName = "";
        const r = triggerEl.getBoundingClientRect();
        menuStyle = `top:${r.bottom + 2}px; left:${r.left}px; width:${r.width}px;`;
    }
</script>

<div class="custom-select bar-select">
    <button type="button" class="trigger" bind:this={triggerEl} popovertarget="menu-{uid}">
        <span class="swatch" style:background={selected ? selected.color : "transparent"}></span>
        <span class="label">{selectedName}</span>
        <span class="caret">▲</span>
    </button>

    <div class="menu" popover id="menu-{uid}" style={menuStyle} onbeforetoggle={positionMenu}>
        <div class="grid" role="group" aria-label={$_('configPannel.listHeaderBarColor')}
            onmouseleave={() => hoveredName = ""}>
            <button type="button" class="dot none" class:active={value === ""}
                aria-label={$_('common.none')}
                popovertarget="menu-{uid}" popovertargetaction="hide"
                onmouseenter={() => hoveredName = $_('common.none')}
                onfocus={() => hoveredName = $_('common.none')}
                onclick={() => value = ""}></button>
            {#each CST.THEME_COLOR as opt}
                <button type="button" class="dot" class:active={value === opt.id}
                    style:background={opt.color}
                    aria-label={$_(opt.name)}
                    popovertarget="menu-{uid}" popovertargetaction="hide"
                    onmouseenter={() => hoveredName = $_(opt.name)}
                    onfocus={() => hoveredName = $_(opt.name)}
                    onclick={() => value = opt.id}></button>
            {/each}
        </div>
        <p class="preview">{hoveredName || selectedName}</p>
    </div>
</div>

<style>
    .bar-select {
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
        rotate: 180deg;
        color: grey;
        transition: transform 0.15s ease;
    }
    .bar-select:has(.menu:popover-open) .caret { transform: rotate(180deg); }

    .menu {
        position: fixed;
        margin: 0;
        padding: 0.5em;
        border: 1px solid grey;
        border-radius: 0.4em;
        background: inherit;
        color: inherit;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(1.5em, 1fr));
        gap: 0.4em;
    }
    .dot {
        width: 100%;
        aspect-ratio: 1;
        padding: 0;
        border: 1px solid rgba(128, 128, 128, 0.45);
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.1s ease;
    }
    .dot:hover { transform: scale(1.15); }
    .dot.active {
        outline: 2px solid currentColor;
        outline-offset: 2px;
    }
    .dot:focus-visible {
        outline: 2px solid rgb(145, 71, 255);
        outline-offset: 2px;
    }
    .dot.none {
        position: relative;
        background: transparent;
        overflow: hidden;
    }
    /* diagonal slash, clipped by the round border to mark the empty choice */
    .dot.none::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to top left,
            transparent calc(50% - 1px), currentColor calc(50% - 1px),
            currentColor calc(50% + 1px), transparent calc(50% + 1px));
    }
    .preview {
        margin: 0.6em 0 0.1em;
        text-align: center;
        font-size: 0.85em;
        opacity: 0.75;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .swatch {
        display: inline-block;
        width: 0.35em;
        height: 1.25em;
        border-radius: 2px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        flex-shrink: 0;
    }
    .label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    @media (prefers-reduced-motion: reduce) {
        .dot, .caret { transition: none; }
        .dot:hover { transform: none; }
    }
</style>
