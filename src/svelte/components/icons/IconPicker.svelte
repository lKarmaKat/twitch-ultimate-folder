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
    import DotaIcon from './DotaIcon.svelte';
    import FortniteIcon from './FortniteIcon.svelte';
    import FortniteIcon2 from './FortniteIcon2.svelte';
    import OverwatchIcon from './OverwatchIcon.svelte';
    import ArcRaidersIcon from './ArcRaidersIcon.svelte';
    import R6Icon from './R6Icon.svelte';
    import GTA6Icon from './GTA6Icon.svelte';
    import GTA5Icon from './GTA5Icon.svelte';
    import MusicIcon1 from './MusicIcon1.svelte';
    import MusicIcon2 from './MusicIcon2.svelte';
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
{:else if iconType === 17}
    <DotaIcon />
{:else if iconType === 18}
    <FortniteIcon />
{:else if iconType === 19}
    <FortniteIcon2 />
{:else if iconType === 20}
    <OverwatchIcon />
{:else if iconType === 21}
    <ArcRaidersIcon />
{:else if iconType === 22}
    <R6Icon />
{:else if iconType === 23}
    <GTA5Icon />
{:else if iconType === 24}
    <GTA6Icon />
{:else if iconType === 25}
    <MusicIcon1 />
{:else if iconType === 26}
    <MusicIcon2 />
{/if}

