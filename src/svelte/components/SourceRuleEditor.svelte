<script>
    import * as CST from '../../constantes.js'
    import { _ } from 'svelte-i18n';
    import SortSelect from './SortSelect.svelte';

    let { listConfig, configManager } = $props();

    const kindOptions = CST.SOURCE_KIND_OPTIONS;
    const languageOptions = CST.TWITCH_LANGUAGE_CODES;

    // Rule-driven content replaces manual placement: only nested sub-lists
    // survive the switch (they stay independently manageable in the tree).
    function onKindChange() {
        if (listConfig.source.kind === CST.SOURCE_KIND_MANUAL) return;
        listConfig.items = listConfig.items.filter(i => i.type === CST.TYPE_LIST);
        if (listConfig.sort === CST.CUSTOM_SORT) listConfig.sort = CST.VIEWER_SORT;
    }

    // Group 1: categories already live among followed channels, zero network call.
    let followedGames = $derived.by(() => {
        const byId = new Map();
        for (const ch of configManager.channelsPickRef) {
            if (!ch.isLive || !ch.game_id) continue;
            const entry = byId.get(ch.game_id) ?? { game_id: ch.game_id, game_name: ch.game_name, count: 0 };
            entry.count++;
            byId.set(ch.game_id, entry);
        }
        return Array.from(byId.values()).sort((a, b) => b.count - a.count);
    });

    let gameQuery = $state('');
    let searchResults = $state([]);
    let searching = $state(false);
    let debounceHandle;
    // Guards against a slow earlier request overwriting a faster later one.
    let searchToken = 0;

    $effect(() => {
        const query = gameQuery.trim();
        clearTimeout(debounceHandle);
        if (query.length < 2) {
            searchResults = [];
            searching = false;
            return;
        }
        const token = ++searchToken;
        searching = true;
        debounceHandle = setTimeout(async () => {
            const results = await configManager.searchCategories(query);
            if (token !== searchToken) return;
            searchResults = results;
            searching = false;
        }, 300);
    });

    function pickGame(game_id, game_name) {
        listConfig.source.game_id = game_id;
        listConfig.source.game_name = game_name;
        gameQuery = '';
        searchResults = [];
    }

    function clearGame() {
        listConfig.source.game_id = null;
        listConfig.source.game_name = null;
    }
</script>

<div class="source-editor">
    <div class="row">
        <p>{$_('configPannel.sourceContent')}</p>
        <span class="help-badge" data-tooltip={$_('configPannel.sourceContentHelp')}>?</span>
        <SortSelect
            bind:value={listConfig.source.kind}
            options={kindOptions}
            onchange={onKindChange}/>
    </div>

    {#if listConfig.source.kind === CST.SOURCE_KIND_GAME}
        <div class="source-block">
            {#if listConfig.source.game_id}
                <div class="source-chip">
                    <span>{listConfig.source.game_name}</span>
                    <button type="button" class="source-chip-clear" onclick={clearGame}>×</button>
                </div>
            {:else}
                <input
                    type="text"
                    bind:value={gameQuery}
                    placeholder={$_('configPannel.sourceGameSearchPlaceholder')}/>
                {#if followedGames.length > 0}
                    <p class="source-group-label">{$_('configPannel.sourceGameFollowedGroup')}</p>
                    <ul class="source-suggestions">
                        {#each followedGames as g (g.game_id)}
                            <li>
                                <button type="button" onclick={() => pickGame(g.game_id, g.game_name)}>
                                    <span class="source-suggestion-name">{g.game_name}</span>
                                    <span class="source-suggestion-count">{g.count}</span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
                {#if gameQuery.trim().length >= 2}
                    <p class="source-group-label">{$_('configPannel.sourceGameSearchGroup')}</p>
                    {#if searching}
                        <p class="source-empty">{$_('configPannel.sourceGameSearching')}</p>
                    {:else if searchResults.length === 0}
                        <p class="source-empty">{$_('configPannel.sourceGameNoResults')}</p>
                    {:else}
                        <ul class="source-suggestions">
                            {#each searchResults as r (r.id)}
                                <li>
                                    <button type="button" onclick={() => pickGame(r.id, r.name)}>
                                        <span class="source-suggestion-name">{r.name}</span>
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                {/if}
            {/if}
        </div>
    {:else if listConfig.source.kind === CST.SOURCE_KIND_LANGUAGE}
        <div class="row">
            <p>{$_('configPannel.sourceLanguage')}</p>
            <select class="source-language-select" bind:value={listConfig.source.language}>
                <option value={null}>{$_('configPannel.sourceLanguagePlaceholder')}</option>
                {#each languageOptions as l (l.id)}
                    <option value={l.id}>{l.label}</option>
                {/each}
            </select>
        </div>
    {:else if listConfig.source.kind === CST.SOURCE_KIND_FRESH}
        <div class="row">
            <p>{$_('configPannel.sourceFreshMinutes')}</p>
            <span class="help-badge" data-tooltip={$_('configPannel.sourceFreshMinutesHelp')}>?</span>
            <input type="number" min="1" bind:value={listConfig.source.freshMinutes}/>
        </div>
    {/if}
</div>

<style>
    .row {
        display: flex;
        align-items: center;
        gap: 0.4em;
        margin: 1em 0;
        flex-wrap: wrap;
    }
    p {
        font-size: 1em;
        padding-bottom: 1px;
    }
    input[type="text"] {
        font-size: 1em;
        width: 100%;
        box-sizing: border-box;
        background: transparent;
        border: 1px solid grey;
        border-radius: 0.3em;
        padding: 0.35em 0.6em;
    }
    input[type="number"] {
        font: inherit;
        width: 4em;
        background: transparent;
        border: 1px solid grey;
        border-radius: 0.3em;
        padding: 0.2em 0.4em;
    }
    .source-language-select {
        font: inherit;
        background: transparent;
        border: 1px solid grey;
        border-radius: 0.3em;
        padding: 0.3em 0.5em;
    }
    .source-block {
        margin: 0.5em 0 1em;
    }
    .source-group-label {
        font-size: 0.8em;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
        margin: 0.7em 0 0.2em;
    }
    .source-suggestions {
        list-style: none;
        margin: 0;
        padding: 0;
        max-height: 12em;
        overflow-y: auto;
        border: 1px solid grey;
        border-radius: 0.3em;
    }
    .source-suggestions li + li {
        border-top: 1px solid rgba(128, 128, 128, 0.35);
    }
    .source-suggestions button {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        gap: 0.5em;
        padding: 0.4em 0.6em;
        background: transparent;
        border: none;
        cursor: pointer;
        color: inherit;
        font: inherit;
        text-align: left;
    }
    .source-suggestions button:hover {
        background: rgba(145, 71, 255, 0.25);
    }
    .source-suggestion-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .source-suggestion-count {
        opacity: 0.7;
        flex: none;
    }
    .source-empty {
        font-size: 0.9em;
        opacity: 0.7;
        margin: 0.2em 0;
    }
    .source-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.5em;
        padding: 0.3em 0.6em;
        border: 1px solid grey;
        border-radius: 999px;
    }
    .source-chip-clear {
        background: transparent;
        border: none;
        cursor: pointer;
        color: inherit;
        font: inherit;
        line-height: 1;
        padding: 0;
    }
</style>
