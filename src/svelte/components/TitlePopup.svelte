<script>
    import { _ } from 'svelte-i18n';
</script>


<style>
    #custom-tooltip {
        z-index: 10;
    }

    :global(.tooltip) {
		white-space: nowrap;
		position: relative;
		padding-top: 0.35rem;
		border-bottom: 1px solid currentColor;
	}
	
	:global(#tooltip) {
		position: absolute;
		top: 0%;
		/* right: 0.78rem; */
        left: 0;
		transform: translate(-100%, 0);
		padding: 0.2rem 0.35rem;
		background: hsl(0, 0%, 20%);
		color: hsl(0, 0%, 98%);
		font-size: 0.95em;
		border-radius: 0.25rem;
		filter: drop-shadow(0 1px 2px hsla(0, 0%, 0%, 0.2));
		width: max-content;
	}

</style>


<div id="custom-tooltip" style="position: fixed; top: 0px; left: 0px; width: 1px; height: 1px;">
    <div tabindex="-1" role="dialog">
        <div class="pos" style="position: absolute; inset: 0px 0px auto auto;">
            <div class="tw-transition" aria-hidden="false">
                <div tabindex="-1" class="focus-visible" data-focus-visible-added="">
                    <div class="body">
                        <p class="content"></p>
                        <div></div>
                    </div>
                </div>
                <div class="hidden-focusable-elem" tabindex="0" role="button" aria-label={$_('titlePopup.closeDialog')} style="opacity: 0;"></div>
            </div>
        </div>
    </div>
</div>