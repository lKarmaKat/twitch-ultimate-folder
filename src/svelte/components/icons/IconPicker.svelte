<script>    
    import FolderIcon from './FolderIcon.svelte';
    import DotIcon from './DotIcon.svelte';
    import AngleIcon from './AngleIcon.svelte';
    import CrossIcon from './CrossIcon.svelte';
    import ValorantIcon from './ValorantIcon.svelte';
    import LOLIcon from './LOLIcon.svelte';
    import RocketLeague1Icon from './RocketLeague1Icon.svelte';
    import RocketLeague2Icon from './RocketLeague2Icon.svelte';
    import COD1Icon from './COD1Icon.svelte';
    import COD2Icon from './COD2Icon.svelte';
    import COD3Icon from './COD3Icon.svelte';
    import COD4Icon from './COD4Icon.svelte';
    import CSIcon from './CSIcon.svelte';
    import MinecraftIcon from './MinecraftIcon.svelte';
    import MinecraftIcon2 from './MinecraftIcon2.svelte';
    import CoffeeIcon from './CoffeeIcon.svelte';
    let {iconType} = $props()
</script>

{#if iconType === 1}
    <FolderIcon />
{:else if iconType === 2}	
    <DotIcon />
{:else if iconType === 3}	
    <AngleIcon />
{:else if iconType === 4}	
    <CrossIcon />
{:else if iconType === 5}	
    <ValorantIcon />
{:else if iconType === 6}	
    <LOLIcon />
{:else if iconType === 7}	
    <RocketLeague1Icon />
{:else if iconType === 8}	
    <RocketLeague2Icon />
{:else if iconType === 9}	
    <COD1Icon />
{:else if iconType === 10}	
    <COD2Icon />
{:else if iconType === 11}	
    <COD3Icon />
{:else if iconType === 12}	
    <COD4Icon />
{:else if iconType === 13}	
    <CSIcon />
{:else if iconType === 14}	
    <MinecraftIcon />
{:else if iconType === 15}	
    <MinecraftIcon2 />
{:else if iconType === 16}	
    <CoffeeIcon />
{/if}

