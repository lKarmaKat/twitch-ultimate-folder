<script>
    import { _ } from 'svelte-i18n';
</script>


<style>
/* HTML: <div class="loader"></div> */
    .loader {
    width: 100%;
    height: 0.5rem;
    background: 
        linear-gradient(90deg,rgba(0, 0, 0, 0.171) 33%,#0005 50%,rgba(0, 0, 0, 0.308) 66%)
        #bf94ff;
    background-size:300% 100%;
    animation: l1 1s infinite linear;
    }
    @keyframes l1 {
    0% {background-position: right}
    }
    .flex-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>

<div class="flex-container">
    <p data-testid="status">{$_('status.waitingConfig')}</p>
    <div class="loader"></div>
</div>