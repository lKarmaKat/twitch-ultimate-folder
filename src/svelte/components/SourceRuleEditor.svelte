<script>
    import * as CST from '../../constantes.js'
    import { _ } from 'svelte-i18n';
    import SortSelect from './SortSelect.svelte';
    import TwitchLanguageSelect from './TwitchLanguageSelect.svelte';
    import { TWITCH_LANGUAGE_FLAGS } from '../../i18n/twitchLanguageFlags.js';
    import { getSourceGames, mirrorLegacyGame } from '../smartList.js';

    let { listConfig, configManager } = $props();

    const kindOptions = CST.SOURCE_KIND_OPTIONS;
    const languageOptions = CST.TWITCH_LANGUAGE_CODES.map(l => ({ id: l.id, name: l.label, flag: TWITCH_LANGUAGE_FLAGS[l.id] }));

    // A rule saved before the cycle existed carries a single inline category:
    // normalising it here is the only migration, and it happens on opening.
    $effect(() => {
        if (!Array.isArray(listConfig.source.games)) {
            listConfig.source.games = getSourceGames(listConfig.source);
        }
    });

    let selectedGames = $derived(listConfig.source.games ?? []);
    let selectedIds = $derived(new Set(selectedGames.map(g => String(g.id))));

    function onKindChange() {
        if (listConfig.source.kind === CST.SOURCE_KIND_MANUAL) return;
        listConfig.items = [];
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

    let query = $derived(gameQuery.trim().toLowerCase());
    let followedSuggestions = $derived(followedGames.filter(g =>
        !selectedIds.has(String(g.game_id))
        && (!query || (g.game_name ?? '').toLowerCase().includes(query))));
    let remoteSuggestions = $derived(searchResults.filter(r => !selectedIds.has(String(r.id))));

    function toggleGame(id, name) {
        const key = String(id);
        listConfig.source.games = selectedIds.has(key)
            ? selectedGames.filter(g => String(g.id) !== key)
            : [...selectedGames, { id: key, name }];
        mirrorLegacyGame(listConfig.source);
    }

    function moveGame(index, delta) {
        const target = index + delta;
        if (target < 0 || target >= selectedGames.length) return;
        const games = [...selectedGames];
        [games[index], games[target]] = [games[target], games[index]];
        listConfig.source.games = games;
        mirrorLegacyGame(listConfig.source);
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
            <input
                type="text"
                bind:value={gameQuery}
                placeholder={$_('configPannel.sourceGameSearchPlaceholder')}/>
            <ul class="source-suggestions">
                {#if selectedGames.length > 0}
                    <li class="source-group-label">{$_('configPannel.sourceGameCycleGroup')} — {selectedGames.length}</li>
                    {#each selectedGames as game, index (game.id)}
                        <li class="selected">
                            <span class="source-rank">{index + 1}</span>
                            <input
                                type="checkbox"
                                id="cycle-{game.id}"
                                checked
                                onchange={() => toggleGame(game.id, game.name)}/>
                            <label class="source-suggestion-name" for="cycle-{game.id}">{game.name}</label>
                            <button
                                type="button"
                                class="source-move"
                                disabled={index === 0}
                                aria-label={$_('configPannel.sourceMoveUp')}
                                onclick={() => moveGame(index, -1)}>▲</button>
                            <button
                                type="button"
                                class="source-move"
                                disabled={index === selectedGames.length - 1}
                                aria-label={$_('configPannel.sourceMoveDown')}
                                onclick={() => moveGame(index, 1)}>▼</button>
                        </li>
                    {/each}
                {/if}

                <li class="source-group-label">{$_('configPannel.sourceGameFollowedGroup')}</li>
                {#each followedSuggestions as g (g.game_id)}
                    <li>
                        <span class="source-rank"></span>
                        <input
                            type="checkbox"
                            id="cycle-{g.game_id}"
                            onchange={() => toggleGame(g.game_id, g.game_name)}/>
                        <label class="source-suggestion-name" for="cycle-{g.game_id}">{g.game_name}</label>
                        <span class="source-suggestion-count">{g.count}</span>
                    </li>
                {:else}
                    <li class="source-empty">{$_('configPannel.sourceGameNoResults')}</li>
                {/each}

                {#if query.length >= 2}
                    <li class="source-group-label">{$_('configPannel.sourceGameSearchGroup')}</li>
                    {#if searching}
                        <li class="source-empty">{$_('configPannel.sourceGameSearching')}</li>
                    {:else}
                        {#each remoteSuggestions as r (r.id)}
                            <li>
                                <span class="source-rank"></span>
                                <input
                                    type="checkbox"
                                    id="cycle-{r.id}"
                                    onchange={() => toggleGame(r.id, r.name)}/>
                                <label class="source-suggestion-name" for="cycle-{r.id}">{r.name}</label>
                            </li>
                        {:else}
                            <li class="source-empty">{$_('configPannel.sourceGameNoResults')}</li>
                        {/each}
                    {/if}
                {/if}
            </ul>

            {#if selectedGames.length > 1}
                <div class="behavior-item">
                    <input
                        type="checkbox"
                        id="sourceAutoRotate"
                        bind:checked={listConfig.source.autoRotate}
                        onchange={() => {
                            if (listConfig.source.rotateSeconds == null) listConfig.source.rotateSeconds = CST.DEFAULT_ROTATE_SECONDS;
                        }}/>
                    <label for="sourceAutoRotate">{$_('configPannel.sourceAutoRotate')}</label>
                    <span class="help-badge" data-tooltip={$_('configPannel.sourceAutoRotateHelp')}>?</span>
                </div>
                {#if listConfig.source.autoRotate}
                    <div class="row">
                        <p>{$_('configPannel.sourceRotateSeconds')}</p>
                        <input
                            type="number"
                            min={CST.MIN_ROTATE_SECONDS}
                            bind:value={listConfig.source.rotateSeconds}/>
                    </div>
                {/if}
            {/if}
        </div>
    {:else if listConfig.source.kind === CST.SOURCE_KIND_LANGUAGE}
        <div class="row">
            <p>{$_('configPannel.sourceLanguage')}</p>
            <TwitchLanguageSelect
                bind:value={listConfig.source.language}
                options={languageOptions}
                placeholder={$_('configPannel.sourceLanguagePlaceholder')}/>
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
    .row,
    .behavior-item {
        display: flex;
        align-items: center;
        gap: 0.4em;
    }
    .row {
        margin: 1em 0;
        flex-wrap: wrap;
    }
    .behavior-item {
        margin-top: 0.9em;
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
    .source-block {
        margin: 0.5em 0 1em;
    }
    .source-suggestions {
        list-style: none;
        margin: 0.5em 0 0;
        padding: 0;
        max-height: 16em;
        overflow-y: auto;
        border: 1px solid grey;
        border-radius: 0.3em;
    }
    .source-suggestions li {
        display: flex;
        align-items: center;
        gap: 0.5em;
        padding: 0.35em 0.6em;
    }
    .source-suggestions li + li {
        border-top: 1px solid rgba(128, 128, 128, 0.35);
    }
    .source-suggestions li.selected {
        background: rgba(145, 71, 255, 0.18);
    }
    /* Sticky so the group a row belongs to stays named while scrolling. */
    .source-group-label {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--panel-surface, inherit);
        font-size: 0.8em;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.7;
    }
    .source-rank {
        flex: none;
        width: 1.1em;
        text-align: center;
        font-size: 0.8em;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
    }
    .source-suggestion-name {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        cursor: pointer;
    }
    .source-suggestion-count {
        opacity: 0.7;
        flex: none;
    }
    .source-move {
        flex: none;
        font: inherit;
        font-size: 0.7em;
        line-height: 1;
        padding: 0.2em;
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
    }
    .source-move[disabled] {
        opacity: 0.25;
        cursor: default;
    }
    .source-empty {
        font-size: 0.9em;
        opacity: 0.7;
    }
</style>
