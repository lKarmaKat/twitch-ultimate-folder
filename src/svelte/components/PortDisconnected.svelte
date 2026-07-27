<script>
    import { _ } from 'svelte-i18n';
    import { reconnect } from '../event.svelte.js';


    let seconds = $state(0);

    // The deadline is the effect's dependency, so it recomputes on every new
    // attempt instead of waiting a tick and showing "16 s" for "15 s".
    $effect(() => {
        const deadline = reconnect.nextAttemptAt;

        // ceil: show 3,2,1 rather than a full second of "0". max: a background
        // tab is throttled, so the attempt can fire late and go negative.
        const tick = () => {
            seconds = deadline
                ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
                : 0;
        };

        tick();
        const id = setInterval(tick, 250);
        return () => clearInterval(id);
    });

</script>

<div class="reconnect" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>

    <div class="text">
        <p class="title" data-testid="status">{$_('status.portDisconnected')}</p>
        <p class="countdown">
            {seconds > 0
                ? $_('status.reconnectIn', { values: { seconds } })
                : $_('status.reconnecting')}
        </p>
    </div>

    <!-- Replayed on every new deadline: {#key} remounts the element, which
         restarts the CSS animation without driving it frame by frame. -->
    {#key reconnect.nextAttemptAt}
        <span class="bar" style="--drain: {reconnect.delay}ms" aria-hidden="true"></span>
    {/key}
</div>

<style>
    /* All in `em`: Twitch sets html{font-size:62.5%}, so 1rem = 10px and a rem
       scale would undersize the block. */
    .reconnect {
        /* Twitch tokens, like NeedToConnect: this banner shows exactly when the
           ports are down. Fallbacks = dark; .light takes over off Twitch. */
        --pd-text: var(--color-text-base, #efeff1);
        --pd-muted: var(--color-text-alt-2, #adadb8);
        --pd-surface: var(--color-background-alt, rgba(255, 255, 255, 0.08));
        --pd-accent: #bf94ff;

        position: relative;
        display: flex;
        align-items: center;
        gap: 0.6em;
        /* margin: 0 0.4em 0.5em; */
        padding: 0.5em 0.7em 0.65em;
        border-radius: 0.4em;
        background: var(--pd-surface);
        overflow: hidden;
    }

    :global(.light) .reconnect {
        --pd-text: var(--color-text-base, #0e0e10);
        --pd-muted: var(--color-text-alt-2, #53535f);
        --pd-surface: var(--color-background-alt, rgba(14, 14, 16, 0.06));
        --pd-accent: #772ce8;
    }

    .spinner {
        flex-shrink: 0;
        width: 1.1em;
        height: 1.1em;
        border: 2px solid rgba(145, 71, 255, 0.3);
        border-top-color: var(--pd-accent);
        border-radius: 50%;
        animation: spin 0.9s linear infinite;
    }

    .text {
        min-width: 0;
    }

    .title {
        margin: 0;
        font-size: 0.95em;
        font-weight: 600;
        line-height: 1.25;
        color: var(--pd-text);
    }

    .countdown {
        margin: 0;
        font-size: 0.85em;
        line-height: 1.3;
        /* Stable digit width: otherwise "10 s" -> "9 s" makes the line jump. */
        font-variant-numeric: tabular-nums;
        color: var(--pd-muted);
    }

    /* Meaningful progress bar: it drains over the exact wait, where an endless
       animation would say nothing about the time left. */
    .bar {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        background: var(--pd-accent);
        transform-origin: left;
        animation: drain var(--drain, 2000ms) linear forwards;
    }

    @keyframes spin {
        to { transform: rotate(1turn); }
    }

    @keyframes drain {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
    }

    @media (prefers-reduced-motion: reduce) {
        .spinner {
            animation: none;
            border-top-color: rgba(145, 71, 255, 0.3);
        }
        .bar {
            animation: none;
        }
    }
</style>
