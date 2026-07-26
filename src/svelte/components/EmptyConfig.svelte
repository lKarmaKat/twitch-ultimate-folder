<script>
    import { _ } from 'svelte-i18n';

    let { configManager } = $props();

    function openConfig() {
        configManager.openConfigPopup();
    }

    // chrome.tabs est hors de portée d'un content script : le service worker
    // ouvre l'onglet a notre place, sur la section « créer une configuration ».
    function openHelp() {
        configManager.openHelpPage('#create-config');
    }
</script>

<div class="empty-state">
    <span class="icon-plate" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
             stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.19a1.5 1.5 0 0 1 1.06.44l1.31 1.31h7.44A1.5 1.5 0 0 1 20 9.25v8.25a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3 17.5z" />
            <path d="M9 13.5h6" opacity="0.55" />
        </svg>
    </span>

    <p class="message" data-testid="status">{$_('status.emptyConfig')}</p>
    <p class="hint">{$_('status.emptyConfigHint')}</p>

    <div class="links">
        <button type="button" class="config-link" onclick={openConfig}>
            {$_('status.openConfig')}
        </button>

        <button type="button" class="config-link" onclick={openHelp}>
            {$_('status.howToCreateConfig')}
        </button>
    </div>
</div>

<style>
    /* Tout est en `em` : Twitch applique html{font-size:62.5%}, donc 1rem = 10px
       et une échelle en rem sous-dimensionne le bloc. En héritant de la taille
       de texte de la sidebar, on s'aligne sur Display.svelte, qui ne déclare
       lui non plus aucun font-size. */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75em;
        padding: 1.8em 1em 1.5em;
        text-align: center;
    }

    .icon-plate {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3.4em;
        height: 3.4em;
        border-radius: 0.6em;
        color: #9147ff;
    }

    .icon-plate svg {
        width: 1.9em;
        height: 1.9em;
    }

    .message {
        margin: 0;
        font-size: 1.15em;
        line-height: 1.3;
        font-weight: 600;
        text-wrap: balance;
    }

    .hint {
        margin: 0;
        font-size: 0.95em;
        line-height: 1.45;
        text-wrap: balance;
    }

    /* Les deux liens forment un bloc : le `gap` du .empty-state les écarterait
       autant que des paragraphes, alors qu'ils vont ensemble. */
    .links {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.1em;
        margin-top: 0.2em;
    }

    .config-link {
        padding: 0.35em 0.2em;
        border: none;
        background: none;
        font: inherit;
        font-size: 1em;
        font-weight: 600;
        color: #9147ff;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 0.2em;
        text-decoration-thickness: 1px;
        border-radius: 0.2em;
        transition: color 0.12s ease;
    }

    .config-link:hover {
        color: #a970ff;
        text-decoration-thickness: 2px;
    }

    .config-link:focus-visible {
        outline: 2px solid #9147ff;
        outline-offset: 0.15em;
    }

    @media (prefers-reduced-motion: reduce) {
        .config-link {
            transition: none;
        }
    }

    /* Mêmes valeurs de halo que FolderIcon, textes repris de la sidebar Twitch. */
    :global(.dark) .icon-plate {
        background: rgba(145, 71, 255, 0.2);
    }
    :global(.dark) .message {
        color: #efeff1;
    }
    :global(.dark) .hint {
        color: #adadb8;
    }

    :global(.light) .icon-plate {
        background: rgba(145, 71, 255, 0.12);
    }
    :global(.light) .message {
        color: #0e0e10;
    }
    :global(.light) .hint {
        color: #53535f;
    }
</style>
