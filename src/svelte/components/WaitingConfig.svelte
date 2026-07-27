<script>
    import { _ } from 'svelte-i18n';
</script>

<!-- #waiting-config: hook for the e2e tests. -->
<div id="waiting-config" class="empty-state" role="status" aria-live="polite">
    <span class="icon-plate" aria-hidden="true">
        <!-- Hourglass: the sand drains, then the glass flips and starts over.
             The flip carries the "still going" an empty bulb no longer says. -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
            <g class="glass">
                <path d="M6.5 3h11M6.5 21h11" />
                <path d="M8 3.4v3.1c0 1 .4 1.9 1.1 2.5L12 12l-2.9 3c-.7.6-1.1 1.5-1.1 2.5v3.1" />
                <path d="M16 3.4v3.1c0 1-.4 1.9-1.1 2.5L12 12l2.9 3c.7.6 1.1 1.5 1.1 2.5v3.1" />
                <polygon class="sand-top" points="8.9,5 15.1,5 12,11.4" fill="currentColor" stroke="none" />
                <polygon class="sand-bot" points="12,12.6 15.6,19 8.4,19" fill="currentColor" stroke="none" />
                <!-- Two streams, not one: the flip reverses the frame, so a
                     single stream would pour upwards for half the cycle. -->
                <rect class="stream stream-a" x="11.72" y="11.2" width="0.56" height="7.4" rx="0.28"
                      fill="currentColor" stroke="none" opacity="0" />
                <rect class="stream stream-b" x="11.72" y="5.4" width="0.56" height="7.4" rx="0.28"
                      fill="currentColor" stroke="none" opacity="0" />
            </g>
        </svg>
    </span>

    <p class="message" data-testid="status">{$_('status.waitingConfig')}</p>
    <p class="hint">{$_('status.waitingConfigHint')}</p>
</div>

<style>
    /* All in `em`: Twitch sets html{font-size:62.5%}, so 1rem = 10px and a rem
       scale would undersize the block. Inherits the sidebar's text size. */
    .empty-state {
        /* Twitch tokens, like NeedToConnect: this block shows before the theme
           is known. Fallbacks = dark; .light takes over off Twitch. */
        --wc-text: var(--color-text-base, #efeff1);
        --wc-muted: var(--color-text-alt-2, #adadb8);
        --wc-accent: #bf94ff;

        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75em;
        padding: 1.8em 1em 1.5em;
        text-align: center;

        /* Delayed loader: most waits are under 200 ms, so the component is
           unmounted before the delay ends and the screen never flickers. */
        opacity: 0;
        animation: appear 0.15s ease 0.25s forwards;
    }

    :global(.light) .empty-state {
        --wc-text: var(--color-text-base, #0e0e10);
        --wc-muted: var(--color-text-alt-2, #53535f);
        --wc-accent: #772ce8;
    }

    .icon-plate {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3.4em;
        height: 3.4em;
        border-radius: 0.6em;
        /* Translucent purple like EmptyConfig: NoLiveChannels' neutral grey
           says "end of the line", but here something is still happening. */
        background: rgba(145, 71, 255, 0.16);
        color: var(--wc-accent);
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
        color: var(--wc-text);
    }

    .hint {
        margin: 0;
        font-size: 0.95em;
        line-height: 1.45;
        text-wrap: balance;
        color: var(--wc-muted);
    }

    /* transform-box: fill-box — without it transform-origin is computed on the
       whole viewBox and the sand triangles skew off. */
    .glass {
        transform-box: fill-box;
        transform-origin: 50% 50%;
        animation: flip 5s ease-in-out infinite;
    }

    .sand-top,
    .sand-bot {
        transform-box: fill-box;
        transform-origin: 50% 100%;
    }

    .sand-top { animation: drain-top 5s linear infinite; }
    .sand-bot { animation: fill-bot 5s linear infinite; }
    .stream-a { animation: stream-a 5s linear infinite; }
    .stream-b { animation: stream-b 5s linear infinite; }

    /* One cycle = two drains separated by a flip, closed at 360deg so the end
       rejoins the start seamlessly. Keyframes self-invert on the second half. */
    @keyframes flip {
        0%, 44%   { transform: rotate(0deg); }
        52%, 94%  { transform: rotate(180deg); }
        100%      { transform: rotate(360deg); }
    }

    /* Sand always flows *towards the neck*, so the origin swaps sides after the
       flip — done between 42% and 54%, where scaleY makes it invisible. */
    @keyframes drain-top {
        0%   { transform-origin: 50% 100%; transform: scaleY(1); }
        42%  { transform-origin: 50% 100%; transform: scaleY(0); }
        54%  { transform-origin: 50% 0%;   transform: scaleY(0); }
        92%  { transform-origin: 50% 0%;   transform: scaleY(1); }
        100% { transform-origin: 50% 0%;   transform: scaleY(1); }
    }

    @keyframes fill-bot {
        0%   { transform-origin: 50% 100%; transform: scaleY(0); }
        42%  { transform-origin: 50% 100%; transform: scaleY(1); }
        54%  { transform-origin: 50% 0%;   transform: scaleY(1); }
        92%  { transform-origin: 50% 0%;   transform: scaleY(0); }
        100% { transform-origin: 50% 0%;   transform: scaleY(0); }
    }

    /* The stream only flows during the drains, never during the flip. */
    @keyframes stream-a {
        0%, 3%    { opacity: 0; }
        6%, 39%   { opacity: 0.8; }
        43%, 100% { opacity: 0; }
    }

    @keyframes stream-b {
        0%, 55%   { opacity: 0; }
        58%, 89%  { opacity: 0.8; }
        93%, 100% { opacity: 0; }
    }

    @keyframes appear {
        to { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
        /* Frozen mid-drain, where the icon still reads as an hourglass. The
           fade becomes a hard cut but keeps its delay, which is what matters. */
        .empty-state {
            animation: appear 0s linear 0.25s forwards;
        }
        .glass,
        .stream {
            animation: none;
        }
        .sand-top {
            animation: none;
            transform: scaleY(0.45);
        }
        .sand-bot {
            animation: none;
            transform: scaleY(0.55);
        }
    }
</style>
