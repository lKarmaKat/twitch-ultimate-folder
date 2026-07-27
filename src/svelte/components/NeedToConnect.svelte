<script>
    import { _ } from 'svelte-i18n';

    // deviceCode: { user_code, verification_uri } once the flow started. It is
    // broadcast, so it also reaches tabs where nobody clicked — by design.
    let { configManager, deviceCode = null, authorizing = false, onAuthorize } = $props();

    // chrome.tabs is out of reach from a content script: the service worker
    // opens the tab for us, on the help page's "How to connect" section.
    function openHelp() {
        configManager.openHelpPage('#connect');
    }
</script>

<!-- #need-connect: hook for the e2e tests (popup.page.ts). -->
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
        <!-- The link carries the code: clicking opens twitch.tv/activate with
             it prefilled, so nobody has to retype it. -->
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
        <!-- Explicit action: the device flow never starts on its own, or every
             Twitch navigation would burn an activation code. -->
        <button
            id="authorize-btn"
            type="button"
            class="authorize"
            onclick={onAuthorize}
            disabled={authorizing}>{$_('status.authorize')}</button>
    {/if}
</div>

<style>
    /* All in `em`: Twitch sets html{font-size:62.5%}, so 1rem = 10px and a rem
       scale would undersize the block. Inherits the sidebar's text size. */
    .empty-state {
        /* Twitch publishes its theme tokens on :root and custom properties
           cross the shadow DOM, so these follow Twitch's theme. Fallbacks are
           for use off Twitch, where .light below takes over. Default: dark. */
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

    /* Off Twitch no token is defined: fall back to the Twitch sidebar values,
       picked from the extension's theme. */
    :global(.light) .empty-state {
        --ntc-text: var(--color-text-base, #0e0e10);
        --ntc-muted: var(--color-text-alt-2, #53535f);
        --ntc-accent: var(--color-text-link, #9147ff);
    }

    /* Out of the flow: the column stays centred on the icon and the text. */
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
        /* Translucent purple: readable on both backgrounds, no need to vary it
           with the theme. */
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

    /* Translucent purple like .icon-plate: readable on both backgrounds, so
       nothing to vary with the theme. */
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
