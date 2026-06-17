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
    :global(.dark) svg {
        fill: #bf94ff; 
    }
    :global(.light) svg {
        fill: #7b3fc9
    }

    :global(.list-header:hover) div.icon-container,
    :global(.display-icon-container.extended) div.icon-container {
        transform: rotate(180deg);
    }


    /* :global(.icon-container) div.icon-container{
        transform: rotate(0deg);
    } */

</style>

<div class="icon-container">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" width="64px" height="64px" viewBox="0 0 199.404 199.404" xml:space="preserve">

<g id="SVGRepo_bgCarrier" stroke-width="0"/>

<g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>

<g id="SVGRepo_iconCarrier"> <g> <polygon points="199.404,63.993 171.12,35.709 99.702,107.127 28.284,35.709 0,63.993 99.702,163.695 "/> </g> </g>

</svg>
</div>
