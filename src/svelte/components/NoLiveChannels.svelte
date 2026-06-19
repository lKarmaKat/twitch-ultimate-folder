<script>
    import { _ } from 'svelte-i18n';
</script>

<style>
    .flex-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>


<div class="flex-container">
    <p data-testid="status">{$_('status.noLiveChannels')}</p>
</div>