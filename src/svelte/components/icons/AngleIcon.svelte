<style>
    div {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        /* padding: .2em 0.3em */
        
        width: 100%;
        height: 100%;
        transition: 300ms ease all;
        
    }
    svg {
        width: 100%;
        height: 100%;
        margin: 0 0.2em;
    }

    /* --icon-open is set by Display.svelte: 1 when the list is open (chevron
       down, the SVG's natural orientation), 0 when collapsed. */
    div.icon-container {
        transform: rotate(calc((1 - var(--icon-open, 1)) * (-90deg)));
    }

</style>

<div class="icon-container">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" width="64px" height="64px" viewBox="0 0 199.404 199.404" xml:space="preserve">

<g id="SVGRepo_bgCarrier" stroke-width="0"/>

<g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>

<g id="SVGRepo_iconCarrier"> <g> <polygon points="199.404,63.993 171.12,35.709 99.702,107.127 28.284,35.709 0,63.993 99.702,163.695 "/> </g> </g>

</svg>
</div>
