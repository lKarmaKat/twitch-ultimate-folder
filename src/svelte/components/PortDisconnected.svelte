<script>
    import { _ } from 'svelte-i18n';
    import { reconnect } from '../event.svelte.js';


    let seconds = $state(0);

    // L'echeance est la dependance de l'effet : il se rejoue donc a chaque
    // nouvelle tentative et recalcule aussitot, au lieu d'attendre le prochain
    // tick. C'est ce qui evite d'afficher « 16 s » au lieu de « 15 s » — une
    // horloge reactive rafraichie a son propre rythme aurait jusqu'a 250 ms de
    // retard sur l'ecriture du store, et ces 250 ms passent au cran superieur.
    // Le composant n'est monte que pendant une coupure : rien ne tourne le
    // reste du temps.
    $effect(() => {
        const deadline = reconnect.nextAttemptAt;

        // ceil : on affiche 3,2,1 plutot que de laisser un « 0 » une seconde
        // entiere. max : un onglet en arriere-plan est throttle par le
        // navigateur, la tentative peut donc partir en retard et l'ecart
        // devenir negatif.
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

    <!-- Rejouee a chaque nouvelle echeance : {#key} remonte l'element, ce qui
         relance l'animation CSS sans avoir a la piloter image par image. -->
    {#key reconnect.nextAttemptAt}
        <span class="bar" style="--drain: {reconnect.delay}ms" aria-hidden="true"></span>
    {/key}
</div>

<style>
    /* Tout est en `em` : Twitch applique html{font-size:62.5%}, donc 1rem = 10px
       et une échelle en rem sous-dimensionne le bloc. */
    .reconnect {
        /* Tokens Twitch, comme NeedToConnect : ce bandeau s'affiche justement
           quand le port `theme` est coupe, donc quand le theme de l'extension
           n'est pas fiable. Replis = sombre ; .light prend le relais hors de
           Twitch (apercu du popup de config). */
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
        /* Largeur de chiffre stable : sinon « 10 s » -> « 9 s » fait sauter la ligne. */
        font-variant-numeric: tabular-nums;
        color: var(--pd-muted);
    }

    /* Barre de progression signifiante : elle se vide sur la duree exacte de
       l'attente, la ou une animation infinie ne dirait rien du delai restant. */
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
