<script>
    import { _ } from 'svelte-i18n';

    let { configManager } = $props();

    // chrome.tabs est hors de portée d'un content script : le service worker
    // ouvre l'onglet a notre place, sur la section « How to connect » de l'aide.
    function openHelp() {
        configManager.openHelpPage('#connect');
    }
</script>

<!-- #need-connect : point d'accroche des tests e2e (popup.page.ts). -->
<div id="need-connect" class="empty-state">
    <button
        type="button"
        class="help-btn"
        onclick={openHelp}
        title={$_('help.openHelp')}
        aria-label={$_('help.openHelp')}>?</button>

    <span class="icon-plate" aria-hidden="true">
        <!-- Meme bouclier que la vue d'autorisation de l'action popup : ce que
             l'utilisateur verra juste apres avoir clique sur l'icone. -->
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5L12 1z" />
        </svg>
    </span>

    <p class="message" data-testid="status">{$_('status.needConnect')}</p>
    <p class="hint">{$_('status.needConnectHint')}</p>
</div>

<style>
    /* Tout est en `em` : Twitch applique html{font-size:62.5%}, donc 1rem = 10px
       et une échelle en rem sous-dimensionne le bloc. En héritant de la taille
       de texte de la sidebar, on s'aligne sur Display.svelte, qui ne déclare
       lui non plus aucun font-size. */
    .empty-state {
        /* Twitch publie ses tokens de theme sur :root, et les custom properties
           traversent le shadow DOM : ces trois variables suivent donc le theme
           *de Twitch*, pas celui de l'extension. C'est ce qu'on veut ici — tant
           que l'utilisateur n'est pas connecte, l'action popup n'affiche que la
           vue d'autorisation et ne permet pas de choisir le theme.
           Les replis servent hors de Twitch (apercu du popup de config), ou la
           classe .light ci-dessous prend le relais. Par defaut : sombre. */
        --ntc-text: var(--color-text-base, #efeff1);
        --ntc-muted: var(--color-text-alt-2, #adadb8);
        --ntc-accent: var(--color-text-link, #bf94ff);

        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75em;
        padding: 1.8em 1em 1.5em;
        text-align: center;
    }

    /* Hors de Twitch, aucun token n'est defini : on retombe sur les valeurs de
       la sidebar Twitch, choisies d'apres le theme de l'extension. */
    :global(.light) .empty-state {
        --ntc-text: var(--color-text-base, #0e0e10);
        --ntc-muted: var(--color-text-alt-2, #53535f);
        --ntc-accent: var(--color-text-link, #9147ff);
    }

    /* Hors du flux : la colonne reste centrée sur l'icône et le texte. */
    .help-btn {
        position: absolute;
        top: 0.6em;
        right: 0.6em;
        width: 1.6em;
        height: 1.6em;
        padding: 0;
        border: none;
        border-radius: 50%;
        background: #9147ff;
        color: #fff;
        font: inherit;
        font-size: 0.9em;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        transition: background 0.12s ease;
    }

    .help-btn:hover {
        background: #772ce8;
    }

    .help-btn:focus-visible {
        outline: 2px solid #9147ff;
        outline-offset: 0.15em;
    }

    .icon-plate {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3.4em;
        height: 3.4em;
        border-radius: 0.6em;
        /* Violet translucide : lisible sur les deux fonds, inutile de le faire
           varier avec le theme. */
        background: rgba(145, 71, 255, 0.16);
        color: var(--ntc-accent);
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
        color: var(--ntc-text);
    }

    .hint {
        margin: 0;
        font-size: 0.95em;
        line-height: 1.45;
        text-wrap: balance;
        color: var(--ntc-muted);
    }

    @media (prefers-reduced-motion: reduce) {
        .help-btn {
            transition: none;
        }
    }
</style>
