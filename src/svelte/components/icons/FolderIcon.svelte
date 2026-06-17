<style>
    div {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        /* padding: .2em 0.3em */
        
        width: 100%;
        height: 100%;
        
    }
    svg {
        width: 100%;
        height: 100%;
        margin: 0 0.2em;
    }
    
    :global(.dark) div {
        background: rgba(145, 71, 255, 0.2);
    }
    :global(.light) div {
        background: rgba(145,71,255,0.12);
    }
</style>

<div class="icon-container">
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1H8L7 2z"></path>
    </svg>
</div>