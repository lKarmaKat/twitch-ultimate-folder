
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
        /* margin: 0 0.2em; */
    }


    :global(.dark) svg {
        fill: #bf94ff; 
        stroke: #bf94ff; 
    }
    :global(.light) svg {
        fill: #7b3fc9;
        stroke: #7b3fc9;
    }

    :global(.list-header:hover) div.icon-container,
    :global(.display-icon-container.extended) div.icon-container{
        transform: rotate(45deg);
    }


    :global(.display-icon-container) div.icon-container{
        transform: rotate(0deg);
    }

</style>

<div class="icon-container">
<svg class="cross" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 16 16" width="16" height="16" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" data-ab-filters-channel="0b50e240-10aa-41ef-89c5-ecf7c373853a">
<path d="m11.25 4.75-6.5 6.5m0-6.5 6.5 6.5"/>
</svg>
</div>