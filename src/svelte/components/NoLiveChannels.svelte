<script>
    import { _ } from 'svelte-i18n';
</script>

<div class="empty-state">
    <span class="icon-plate" aria-hidden="true">
        <!-- Twitch's "live" dot, switched off. -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" opacity="0.45" stroke-linecap="round" />
        </svg>
    </span>

    <p class="message" data-testid="status">{$_('status.noLiveChannels')}</p>
    <p class="hint">{$_('status.noLiveChannelsHint')}</p>
</div>

<style>
    /* All in `em`: Twitch sets html{font-size:62.5%}, so 1rem = 10px and a rem
       scale would undersize the block. Inherits the sidebar's text size. */
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75em;
        padding: 1.8em 1em 1.5em;
        text-align: center;
    }

    /* Neutral register: this state calls for no action, so it must not carry
       the purple reserved for clickable things. */
    .icon-plate {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3.4em;
        height: 3.4em;
        border-radius: 0.6em;
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

    :global(.dark) .icon-plate {
        background: rgba(255, 255, 255, 0.08);
        color: #adadb8;
    }
    :global(.dark) .message {
        color: #efeff1;
    }
    :global(.dark) .hint {
        color: #adadb8;
    }

    :global(.light) .icon-plate {
        background: rgba(14, 14, 16, 0.06);
        color: #53535f;
    }
    :global(.light) .message {
        color: #0e0e10;
    }
    :global(.light) .hint {
        color: #53535f;
    }
</style>
