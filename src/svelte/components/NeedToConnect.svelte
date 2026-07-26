<script>
    import { _ } from 'svelte-i18n';

    // deviceCode : { user_code, verification_uri } une fois le flow lancé. Il
    // arrive par diffusion, donc aussi dans les onglets d'où personne n'a
    // cliqué — c'est voulu, on saisit le code depuis n'importe lequel.
    let { configManager, deviceCode = null, authorizing = false, onAuthorize } = $props();

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
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 11V5L12 1z" />
        </svg>
    </span>

    {#if deviceCode}
        <p class="message" data-testid="status">{$_('status.authTitle')}</p>
        <p class="hint">
            {$_('status.authInstructionBefore')}
            <strong>twitch.tv/activate</strong>
            {$_('status.authInstructionAfter')}
        </p>
        <!-- Le lien porte le code : cliquer ouvre twitch.tv/activate, code
             déjà rempli, ce qui évite de le recopier à la main. -->
        <a
            id="device-code"
            class="code"
            href={deviceCode.verification_uri}
            target="_blank"
            rel="noopener noreferrer">{deviceCode.user_code}</a>
        <p class="waiting">{$_('status.authWaiting')}</p>
    {:else}
        <p class="message" data-testid="status">{$_('status.needConnect')}</p>
        <p class="hint">{$_('status.needConnectHint')}</p>
        <!-- Geste explicite : le device flow ne part jamais tout seul, sinon
             chaque navigation Twitch brûlerait un code d'activation. -->
        <button
            id="authorize-btn"
            type="button"
            class="authorize"
            onclick={onAuthorize}
            disabled={authorizing}>{$_('status.authorize')}</button>
    {/if}
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

    .authorize {
        margin-top: 0.2em;
        padding: 0.55em 1.1em;
        border: none;
        border-radius: 0.4em;
        background: #9147ff;
        color: #fff;
        font: inherit;
        font-size: 0.95em;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.12s ease, opacity 0.12s ease;
    }

    .authorize:hover:not(:disabled) {
        background: #772ce8;
    }

    .authorize:disabled {
        opacity: 0.55;
        cursor: default;
    }

    .authorize:focus-visible {
        outline: 2px solid #9147ff;
        outline-offset: 0.15em;
    }

    /* Violet translucide, comme .icon-plate : lisible sur les deux fonds, donc
       rien à faire varier avec le theme. */
    .code {
        margin-top: 0.1em;
        padding: 0.35em 0.8em;
        border: 1px solid var(--ntc-accent);
        border-radius: 0.4em;
        background: rgba(145, 71, 255, 0.16);
        color: var(--ntc-accent);
        font-size: 1.3em;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-decoration: none;
        cursor: pointer;
        transition: background 0.12s ease;
    }

    .code:hover {
        background: rgba(145, 71, 255, 0.28);
    }

    .waiting {
        margin: 0;
        font-size: 0.85em;
        color: var(--ntc-muted);
        opacity: 0.8;
    }

    @media (prefers-reduced-motion: reduce) {
        .help-btn,
        .authorize,
        .code {
            transition: none;
        }
    }
</style>
