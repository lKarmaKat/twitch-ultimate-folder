<script>
	import { configChangeEvent, allOthersChannelSelectedEvent } from "../event.svelte.js";
    import * as CST from '../../constantes.js'
    import { _ } from 'svelte-i18n';
    import { writable } from 'svelte/store';
    import ConfigManager from "../configManager.svelte.js";
    import IconSelect from "./IconSelect.svelte";
    import BarColorSelect from "./BarColorSelect.svelte";
    import CounterTypeSelect from "./CounterTypeSelect.svelte";
    import SortSelect from "./SortSelect.svelte";
    import SourceRuleEditor from "./SourceRuleEditor.svelte";
    import { ICON_NONE } from './icons/index.js';

    let { configManager } = $props();
    let listeId;
    let listConfig = $state();
    let allOtherItem = $state();
    const sortOptions = CST.SORT_STRATEGY.filter(s => s.id !== CST.CUSTOM_SORT);
    const headerOptions = CST.ALL_OTHER_HEADER_TYPE;
    const behaviorTypeOptions = CST.TYPE_OPTIONS.filter(o => o.group === 'behavior');
    const styleTypeOptions = CST.TYPE_OPTIONS.filter(o => o.group === 'style');
    const layoutOptions = CST.LIST_LAYOUT_OPTIONS;
    let showsColumns = $derived(listConfig?.type.layout === CST.LIST_LAYOUT_SPLIT || listConfig?.type.layout === CST.LIST_LAYOUT_GRID);
    let showsRail = $derived(!CST.LIST_LAYOUTS_WITHOUT_RAIL.includes(listConfig?.type.layout));
    // A rule-driven list refills itself: custom sort (drag order) has nothing to act on.
    let isSmartList = $derived((listConfig?.source?.kind ?? CST.SOURCE_KIND_MANUAL) !== CST.SOURCE_KIND_MANUAL);
    let sortSelectOptions = $derived(isSmartList ? sortOptions : CST.SORT_STRATEGY);
    $effect(() => {
        listeId = configChangeEvent.current;
        if (listeId) {
            listConfig = configManager.selectedConfig[listeId];
            // Configs saved before these options existed have no key to bind on
            for (const opt of CST.STYLE_OPTIONS) {
                let group = listConfig?.style?.[opt.group];
                if (group && group[opt.key] === undefined) group[opt.key] = false;
            }
            if (listConfig?.type && listConfig.type.height === undefined) listConfig.type.height = CST.HEADER_HEIGHT_MEDIUM;
            for (const opt of CST.TYPE_OPTIONS) {
                if (listConfig?.type && listConfig.type[opt.key] === undefined) listConfig.type[opt.key] = false;
            }
            if (listConfig?.type) {
                if (listConfig.type.layout === undefined) listConfig.type.layout = CST.LIST_LAYOUT_STACK;
                if (listConfig.type.columns === undefined) listConfig.type.columns = 2;
                if (listConfig.type.maxItems === undefined) listConfig.type.maxItems = 0;
            }
            if (listConfig && listConfig.source === undefined) listConfig.source = CST.createDefaultSource();
            let item = listConfig?.items?.find(i => i.channel_id === CST.ALL_OTHER_CHANNELS);
            if (item && item.sort === undefined) item.sort = CST.ALPHA_SORT;
            if (item && item.type === undefined) item.type = CST.ALL_OTHER_HEADER_NONE;
            if (item && item.height === undefined) item.height = CST.HEADER_HEIGHT_MEDIUM;
            if (item && item.iconType === undefined) item.iconType = ICON_NONE;
            allOtherItem = item;
        } else {
            listConfig = null;
            allOtherItem = null;
        }
    })

    // let otherChannelsConfig = $state();
    // $effect(() => {
        
    // })

</script>

<div class="pannel-container">
    {#if allOthersChannelSelectedEvent.current}
        {#if allOtherItem}
            <div class="pannel-header">
                <p>{$_('display.allOtherChannels')}</p>
            </div>
            <div class="pannel-body">
                <div class="bloc">
                    <div class="row">
                        <p>{$_('configPannel.headerMode')}</p>
                        <span class="help-badge" data-tooltip={$_('configPannel.headerModeHelp')}>?</span>
                        <SortSelect
                            bind:value={allOtherItem.type}
                            options={headerOptions}/>
                    </div>
                    {#if allOtherItem.type === CST.ALL_OTHER_HEADER_SORTABLE}
                        <div class="row">
                            <p>{$_('configPannel.headerSize')}</p>
                            <span class="help-badge" data-tooltip={$_('configPannel.headerSizeHelp')}>?</span>
                            <SortSelect
                                bind:value={allOtherItem.height}
                                options={CST.HEADER_HEIGHT_TYPE}/>
                        </div>
                        {#if allOtherItem.height !== CST.HEADER_HEIGHT_SMALL}
                            <div class="row">
                                <p>{$_('configPannel.listHeaderIcon')}</p>
                                <span class="help-badge" data-tooltip={$_('configPannel.listIconHelp')}>?</span>
                                <IconSelect
                                    bind:value={allOtherItem.iconType}/>
                            </div>
                        {/if}
                    {/if}
                    <div class="row">
                        <p>{$_('configPannel.sortMode')}</p>
                        <span class="help-badge" data-tooltip={$_('configPannel.sortStrategy')}>?</span>
                        <SortSelect
                            bind:value={allOtherItem.sort}
                            options={sortOptions}/>
                    </div>
                </div>
            </div>
        {/if}
    {:else if listConfig}
        <div class="pannel-header">
            <!-- svelte-ignore missing-declaration -->
            <p>{$_('configPannel.listName')} : </p>
            <input type="text"
            name="liste-name"
            id="liste-name"
            bind:value={listConfig.name} placeholder={$_('configPannel.listNamePlaceholder')} />
        </div>
        {#if listConfig.behavior}
            <div class="pannel-body">
                <div class="bloc">
                    <SourceRuleEditor listConfig={listConfig} configManager={configManager}/>
                </div>
                <div class="bloc">
                    <p>{$_('configPannel.behavior')}</p>
                    <div class="grid">
                        {#each CST.BEHAVIOUR as item}
                            <div class="behavior-item">
                                <input
                                    type="checkbox"
                                    id={item.id}
                                    bind:checked={listConfig.behavior[item.id]}/>
                                <label for={item.key}>{$_(item.label)}</label>
                                <span
                                    class="help-badge"
                                    data-tooltip={$_(item.tooltip)}>?</span>
                            </div>
                        {/each}
                        {#each behaviorTypeOptions as item}
                            <div class="behavior-item">
                                <input
                                    type="checkbox"
                                    id={item.key}
                                    bind:checked={listConfig.type[item.key]}/>
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
                            bind:value={listConfig.sort}
                            options={sortSelectOptions}/>
                    </div>
                </div>
                <div class="bloc">
                    <p>{$_('configPannel.style')}</p>
                    <div class="row">
                        <p>{$_('configPannel.listLayout')}</p>
                        <span class="help-badge" data-tooltip={$_('configPannel.listLayoutHelp')}>?</span>
                        <SortSelect
                            bind:value={listConfig.type.layout}
                            options={layoutOptions}/>
                    </div>
                    {#if showsColumns}
                        <div class="row">
                            <p>{$_('configPannel.listColumns')}</p>
                            <input type="number" min="2" max="6" bind:value={listConfig.type.columns} />
                        </div>
                    {/if}
                    <div class="row">
                        <p>{$_('configPannel.maxItems')}</p>
                        <span class="help-badge" data-tooltip={$_('configPannel.maxItemsHelp')}>?</span>
                        <input type="number" min="0" bind:value={listConfig.type.maxItems} />
                    </div>
                    <div class="grid">
                        {#each CST.STYLE_OPTIONS as item}
                            {#if item.key !== CST.STYLE_INDENT_RAIL || showsRail}
                                <div class="behavior-item">
                                    <input
                                        type="checkbox"
                                        id={item.key}
                                        bind:checked={listConfig.style[item.group][item.key]}/>
                                    <label for={item.key}>{$_(item.label)}</label>
                                    <span
                                        class="help-badge"
                                        data-tooltip={$_(item.tooltip)}>?</span>
                                </div>
                            {/if}
                        {/each}
                        {#each styleTypeOptions as item}
                            <div class="behavior-item">
                                <input
                                    type="checkbox"
                                    id={item.key}
                                    bind:checked={listConfig.type[item.key]}/>
                                <label for={item.key}>{$_(item.label)}</label>
                                <span
                                    class="help-badge"
                                    data-tooltip={$_(item.tooltip)}>?</span>
                            </div>
                        {/each}
                    </div>
                    <div class="row">
                        <p>{$_('configPannel.headerSize')}</p>
                        <span
                            class="help-badge"
                            data-tooltip={$_('configPannel.headerSizeHelp')}>?</span>
                        <SortSelect
                            bind:value={listConfig.type.height}
                            options={CST.HEADER_HEIGHT_TYPE}/>
                    </div>
                    {#if listConfig.type.height !== CST.HEADER_HEIGHT_SMALL}
                        <div class="row">
                            <p>{$_('configPannel.listHeaderIcon')}</p>
                            <span
                                class="help-badge"
                                data-tooltip={$_('configPannel.listIconHelp')}>?</span>
                            <IconSelect
                                bind:value={listConfig.type.iconType}/>
                        </div>
                    {/if}
                    <div class="row">
                        <p>{$_('configPannel.listHeaderBarColor')}</p>
                        <span
                            class="help-badge"
                            data-tooltip={$_('configPannel.listHeaderBarColorHelp')}>?</span>
                        <BarColorSelect
                            bind:value={listConfig.type.barType}/>
                    </div>
                    <div class="row">
                        <p>{$_('configPannel.listHeaderBadge')}</p>
                        <span
                            class="help-badge"
                            data-tooltip={$_('configPannel.listCounterBadgeHelp')}>?</span>
                        <CounterTypeSelect
                            bind:value={listConfig.type.viewerCountType}/>
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
            <p class="blinker">{$_('configPannel.selectListPrompt')}</p>
        </div>
    {/if}
</div>


<style>
    .select-channel-flex {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0;
        height: 100%;
    }
    .select-channel-flex p {
        opacity: 1.0;
        font-size: 1.5em;
        text-align: center;
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
        padding: 0.3em 0em 0.3em 0em;
    }
    .pannel-header {
        display: flex;
        flex-direction: row;
        padding: 0.3em 1em;
        border-radius: .3em;
        min-width: 0;
    }
    .pannel-header input {
        flex: 1 1 auto;
        /* Without this the input keeps its intrinsic width (size=20) and overflows */
        min-width: 0;
        /* width: 100%; */
        width: auto;
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
    input[type="number"] {
        font: inherit;
        width: 4em;
        background: transparent;
        border: 1px solid grey;
        border-radius: 0.3em;
        padding: 0.2em 0.4em;
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

/* The "?" badge */
/* .help-badge {
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
} */

/* Small arrow */
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
/* .help-badge:hover::after,
.help-badge:hover::before {
    opacity: 1;
    transform: translateX(5%) translateY(50%);
} */
</style>