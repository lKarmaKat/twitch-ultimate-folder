<script>
    import { ICON_BY_ID } from './index';

    let { iconType } = $props();
    let Cmp = $derived(ICON_BY_ID.get(iconType)?.component);
</script>

{#if Cmp}
    <Cmp />
{/if}
