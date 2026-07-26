<script>
    import { _ } from 'svelte-i18n';
</script>

<!-- #waiting-config : point d'accroche des tests e2e. -->
<div id="waiting-config" class="empty-state" role="status" aria-live="polite">
    <span class="icon-plate" aria-hidden="true">
        <!-- Sablier : le sable se vide, puis le verre fait un demi-tour et
             repart. Le demi-tour porte le « ça avance encore » qu'un simple
             vidage ne dit plus une fois la coupe vide. -->
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round">
            <g class="glass">
                <path d="M6.5 3h11M6.5 21h11" />
                <path d="M8 3.4v3.1c0 1 .4 1.9 1.1 2.5L12 12l-2.9 3c-.7.6-1.1 1.5-1.1 2.5v3.1" />
                <path d="M16 3.4v3.1c0 1-.4 1.9-1.1 2.5L12 12l2.9 3c.7.6 1.1 1.5 1.1 2.5v3.1" />
                <polygon class="sand-top" points="8.9,5 15.1,5 12,11.4" fill="currentColor" stroke="none" />
                <polygon class="sand-bot" points="12,12.6 15.6,19 8.4,19" fill="currentColor" stroke="none" />
                <!-- Deux filets plutot qu'un : le demi-tour renverse le repere,
                     et un filet unique se retrouverait a couler dans la coupe
                     du haut sur la seconde moitie du cycle. Chacun ne s'allume
                     que pendant le vidage ou il tombe du bon cote du col. -->
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
    /* Tout est en `em` : Twitch applique html{font-size:62.5%}, donc 1rem = 10px
       et une échelle en rem sous-dimensionne le bloc. En héritant de la taille
       de texte de la sidebar, on s'aligne sur Display.svelte, qui ne déclare
       lui non plus aucun font-size. */
    .empty-state {
        /* Tokens Twitch, comme NeedToConnect et PortDisconnected : ce bloc
           s'affiche justement avant que le port `theme` ait répondu, donc quand
           le theme de l'extension n'est pas encore connu. Replis = sombre ;
           .light prend le relais hors de Twitch (apercu du popup de config). */
        --wc-text: var(--color-text-base, #efeff1);
        --wc-muted: var(--color-text-alt-2, #adadb8);
        --wc-accent: #bf94ff;

        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75em;
        padding: 1.8em 1em 1.5em;
        text-align: center;

        /* Loader retarde : la plupart des attentes durent moins de 200 ms, et le
           composant est alors demonte avant la fin du delai — l'ecran ne bouge
           pas. Au-dela, le sablier arrive en fondu. C'est le pendant CSS du
           `setTimeout` qui vivait dans DisplayWrapper, mais a l'envers : on
           retarde l'etat de chargement au lieu de retarder le contenu. */
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
        /* Violet translucide comme EmptyConfig : lisible sur les deux fonds.
           Le gris neutre de NoLiveChannels dit « fin de course » ; ici quelque
           chose est en train de se passer, c'est le violet du spinner de
           PortDisconnected qui convient. */
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

    /* transform-box: fill-box — sans lui, transform-origin se calcule sur le
       viewBox entier et les triangles de sable partent de travers. */
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

    /* Un cycle = deux vidages separes par un demi-tour, et le tour est boucle a
       360deg pour que la fin de cycle rejoigne le debut sans a-coup. Le sable
       repart a l'endroit apres chaque demi-tour : la coupe locale « haut » est
       alors affichee en bas, donc les keyframes s'inversent d'elles-memes sur la
       seconde moitie. */
    @keyframes flip {
        0%, 44%   { transform: rotate(0deg); }
        52%, 94%  { transform: rotate(180deg); }
        100%      { transform: rotate(360deg); }
    }

    /* Le sable coule toujours *vers le col*, jamais l'inverse : chaque tas se
       retracte du cote du col et grossit depuis sa base. Apres le demi-tour ces
       deux points s'echangent, d'ou l'origine qui bascule d'un bord a l'autre en
       cours de cycle. La bascule se joue entre 42% et 54%, quand le transform
       vaut identite (scaleY(1)) ou ne rend rien (scaleY(0)) : elle est donc
       strictement invisible. */
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

    /* Le filet ne coule que pendant les vidages, jamais pendant le demi-tour. */
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
        /* Le sablier se fige a mi-course : l'icone reste lisible comme telle,
           la ou un verre plein ou vide ressemble a un pictogramme quelconque.
           Le fondu devient une apparition seche, mais garde son delai — c'est
           lui qui evite le clignotement, pas l'animation. */
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
