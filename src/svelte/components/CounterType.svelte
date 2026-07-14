<script>
    import * as CST from '../../constantes.js'
    import { _ } from 'svelte-i18n';

    let { counter, viewerCountType, totalChannels } = $props();

    let counterBadge = $derived.by(() => [
        CST.COUNTER_TYPE[1].id,
        CST.COUNTER_TYPE[2].id,
        CST.COUNTER_TYPE[3].id,
        CST.COUNTER_TYPE[4].id
    ].includes(viewerCountType));

    let counterBadgeText = $derived.by(() => CST.COUNTER_TYPE[1].id === viewerCountType);
    let displayCounter = $derived.by(() => viewerCountType);
    let displayTotalCounter = $derived.by(() => [
                        CST.COUNTER_TYPE[3].id,
                        CST.COUNTER_TYPE[4].id
                    ].includes(viewerCountType));
    let displayLiveIcon = $derived.by(() => CST.COUNTER_TYPE[4].id === viewerCountType);
    let noLive = $derived.by(() => counter === 0);
</script>

{#if displayCounter}
    <span class:badge={counterBadge} class:no-live={counterBadge && noLive}  class="counter">
        {#if counter > 0 && displayLiveIcon}
            <div class="live-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6.343 4.938a1 1 0 0 1 0 1.415a8.003 8.003 0 0 0 0 11.317a1 1 0 1 1-1.414 1.414c-3.907-3.906-3.907-10.24 0-14.146a1 1 0 0 1 1.414 0Zm12.732 0c3.906 3.907 3.906 10.24 0 14.146a1 1 0 0 1-1.415-1.414a8.003 8.003 0 0 0 0-11.317a1 1 0 0 1 1.415-1.415ZM9.31 7.812a1 1 0 0 1 0 1.414a3.92 3.92 0 0 0 0 5.544a1 1 0 1 1-1.415 1.414a5.92 5.92 0 0 1 0-8.372a1 1 0 0 1 1.415 0Zm6.958 0a5.92 5.92 0 0 1 0 8.372a1 1 0 0 1-1.414-1.414a3.92 3.92 0 0 0 0-5.544a1 1 0 0 1 1.414-1.414Zm-4.186 2.77a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3Z"></path></svg>
            </div>
        {:else if displayLiveIcon}            
            <div class="nolive-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3.28 2.22a.75.75 0 1 0-1.06 1.06l2.203 2.203c-3.393 3.93-3.224 9.872.506 13.601a1 1 0 0 0 1.414-1.414a8.004 8.004 0 0 1-.501-10.768l1.52 1.52a5.922 5.922 0 0 0 .533 7.763A1 1 0 0 0 9.31 14.77a3.922 3.922 0 0 1-.513-4.913l1.835 1.836a1.503 1.503 0 0 0 1.45 1.889c.134 0 .264-.018.388-.051l8.25 8.25a.75.75 0 1 0 1.06-1.061L3.28 2.22Zm15.748 13.626l1.462 1.462c2.414-3.861 1.942-9.012-1.415-12.37a1 1 0 1 0-1.415 1.415a8.006 8.006 0 0 1 1.368 9.493Zm-3.098-3.098l1.591 1.591a5.922 5.922 0 0 0-1.253-6.527a1 1 0 1 0-1.414 1.414a3.917 3.917 0 0 1 1.076 3.522Z"></path></svg>
            </div>
        {/if}
        {counter}
        {#if counterBadgeText}
            {$_('counter.live')}
        {/if}
        {#if displayTotalCounter}
            /{totalChannels}
        {/if}
    </span>
{/if}

<style>
    /* .badge {
        font-weight: 500;
        padding: 2px 7px;
        border-radius: 99px;
    }
    .badge {
        display: flex;
        flex-direction: row;
    }
    .live-icon {
        width: 100%;
        height: 100%;
    } */
    .counter {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
    .badge {
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 99px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 4px;
    }
    .live-icon,
    .nolive-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }
    .live-icon svg,
    .nolive-icon svg {
        width: 100%;
        height: 100%;
    }
</style>
