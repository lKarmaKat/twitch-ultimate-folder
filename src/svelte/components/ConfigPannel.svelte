<script>
	import { configChangeEvent } from "../event.svelte.js";
    import * as CST from '../../constantes.js'
    import { _ } from 'svelte-i18n';
    import { writable } from 'svelte/store';
    import ConfigManager from "../configManager.svelte.js";
    import IconSelect from "./IconSelect.svelte";
    import BarColorSelect from "./BarColorSelect.svelte";
    import CounterTypeSelect from "./CounterTypeSelect.svelte";
    import SortSelect from "./SortSelect.svelte";

    let { configManager } = $props();
    let listeId;
    let config = $state();
    $effect(() => {
        listeId = configChangeEvent.current;
        config = configManager.selectedConfig[listeId];
    })

</script>

<div class="pannel-container">
    {#if config}
    <div class="pannel-header">
        <!-- svelte-ignore missing-declaration -->
        <p>{$_('configPannel.listName')} : </p>
        <input type="text"
        name="liste-name"
        id="liste-name"
        bind:value={config.name} placeholder={$_('configPannel.listNamePlaceholder')} />
    </div>
    {#if config.behavior}
    <div class="pannel-body">
        <div class="bloc">
            <p>{$_('configPannel.behavior')}</p>
            <div class="grid">
                {#each CST.BEHAVIOUR as item}
                    <div class="behavior-item">
                        <input
                            type="checkbox"
                            id={item.id}
                            bind:checked={config.behavior[item.id]}/>
                        <label for={item.key}>{$_(item.label)}</label>
                        <span
                            class="help-badge"
                            data-tooltip={$_(item.tooltip)}>?</span>
                    </div>
                {/each}
            </div>
            <div class="row">
                <p>{$_('configPannel.sortMode')}</p>
                <span class="help-badge" data-tooltip={$_('configPannel.sortStrategy')}>?</span>
                <SortSelect
                    bind:value={config.sort}
                    options={CST.SORT_STRATEGY}/>
            </div>
        </div>
        <div class="bloc">
            <p>{$_('configPannel.style')}</p>
            <!-- <div class="row">
                <select name="header-size" id="header-size" bind:value={config.type.height} onchange={updateConfig}>
                    {#each CST.HEADER_TYPE_HEIGHT as headerHeight}
                        <option value={headerHeight.id}>{headerHeight.name}</option>
                    {/each}
                </select>
            </div> -->
            <div class="row">
                <p>{$_('configPannel.listHeaderIcon')}</p>
                <span
                    class="help-badge"
                    data-tooltip={$_('configPannel.listIconHelp')}>?</span>
                <IconSelect
                    bind:value={config.type.iconType}/>
            </div>
            <div class="row">
                <p>{$_('configPannel.listHeaderBarColor')}</p>
                <span
                    class="help-badge"
                    data-tooltip={$_('configPannel.listHeaderBarColorHelp')}>?</span>
                <BarColorSelect
                    bind:value={config.type.barType}/>
            </div>
            <div class="row">
                <p>{$_('configPannel.listHeaderBadge')}</p>
                <span
                    class="help-badge"
                    data-tooltip={$_('configPannel.listCounterBadgeHelp')}>?</span>
                <CounterTypeSelect
                    bind:value={config.type.viewerCountType}/>
            </div>
            <!-- <div class="row">
                <select name="theme" id="theme" bind:value={config.style.theme} onchange={updateConfig}>
                    <option value={CST.SYSTEM_STYLE}>System theme</option>
                    <option value={CST.CUSTOM_STYLE}>Custom</option>
                </select>
            </div> -->
            <!-- {#if config.style.theme === CST.CUSTOM_STYLE}
            <div class="row">
                <p>Header color</p>
                <select name="header-color" id="header-color" bind:value={config.style.header.headerColor} onchange={updateConfig}>
                    {#each colorsList as color}
                        <option value={color.colorCode}>
                            {capitalizeFirstLetter(color.colorName)}
                        </option>
                    {/each}
                </select>
                <input type="color" name="header-color" id="header-color"
                bind:value={config.style.header.headerColor} onchange={updateConfig}><label for="header-color"></label>
            </div>
            <div class="row">
                <p>Content color</p>
                <select name="header-color" id="header-color" bind:value={config.style.content.contentColor} onchange={updateConfig}>
                    {#each colorsList as color}
                    <option value={color.colorCode}>
                        {capitalizeFirstLetter(color.colorName)}
                    </option>
                    {/each}
                </select>
                <input type="color" name="header-color" id="content-color"
                bind:value={config.style.content.contentColor} onchange={updateConfig}><label for="content-color"></label>   
            </div>
            {/if} -->
        </div>
    </div>
    {/if}

    {:else}
        <div class="select-channel-flex">
            <h2 class="blinker">Please click on a list header to customize it</h2>
        </div>
    {/if}
</div>


<style>
    .select-channel-flex {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: start;
        margin: 6em 0 0 0;
        height: 100%;
    }
    .select-channel-flex h2 {
        opacity: 1.0;
    }
    .blinker {
    animation: blinker 2s ease-in-out infinite;
    }
    @keyframes blinker {
        from { opacity: 1; }
        50%   { opacity: 0.6; }
        to { opacity: 1; }
    }
    .pannel-container {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 0.3em 0.8em;
    }
    .pannel-header {
        display: flex;
        flex-direction: row;
        padding: 0.3em 1em;
        border-radius: .3em;
    }
    .pannel-header input {
        /* width: 90%; */
    }
    .bloc {
        margin: 0.5em 0em;
        padding: 0.5em 1em;
        border: 1px solid grey;
        border-radius: .5em;
    }
    .pannel-body {
        display: flex;
        flex-direction: column;
    }
    p {
        font-size: 1em;
        /* To keep the alignment when the p becomes an input */
        padding-bottom: 1px; 
    }
    input[type=text] {
        font-size: 1em;
        background: transparent;
        border: none;
        border-bottom: 1px solid #000000;
    }
    input[type="text"]:focus {
        outline: none;
    }
    .behavior-item,
    .row {
        display: flex;
        align-items: center;
        gap: 0.4em;
    }
    .row {
        margin: 1em 0;
        flex-wrap: wrap;
    }

/* La pastille "?" */
.help-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    color: #fff;
    font-size: 0.7em;
    font-weight: 700;
    cursor: help;
    user-select: none;
    flex-shrink: 0;
}

/* Le tooltip */
.help-badge::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(5%) translateY(40%);
    width: max-content;
    max-width: 200px;
    padding: 0.4em 0.6em;
    border-radius: 0.4em;
    background: #1f1f23;
    color: #efeff1;
    font-size: 1.6em;
    font-weight: 400;
    line-height: 1.3;
    text-align: center;
    white-space: normal;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
    z-index: 10;
}

/* Petite flèche */
/* .help-badge::before {
    content: "";
    position: absolute;
    bottom: calc(100% + 1px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    border: 5px solid transparent;
    border-top-color: #1f1f23;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
    z-index: 10;
} */
.help-badge:hover::after,
.help-badge:hover::before {
    opacity: 1;
    transform: translateX(5%) translateY(50%);
}
</style>