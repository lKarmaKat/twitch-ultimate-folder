<script>
    import * as CST from '../../constantes.js'

    let { counter, viewerCountType } = $props();

    let counterBadge = $derived.by(() => [
        CST.COUNTER_TYPE[1].id,
        CST.COUNTER_TYPE[2].id
    ].includes(viewerCountType));

    let counterBadgeText = $derived.by(() => CST.COUNTER_TYPE[1].id === viewerCountType);
    let displayCounter = $derived.by(() => viewerCountType);
</script>

{#if displayCounter}
    <span class:badge={counterBadge} class="counter">
        {counter}
        {#if counterBadgeText}
            live
        {/if}
    </span>
{/if}

<style>
    .badge {
        font-weight: 500;
        padding: 2px 7px;
        border-radius: 99px;
    }
</style>
