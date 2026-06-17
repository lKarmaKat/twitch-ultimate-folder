<script>
	import { configChangeEvent } from "../event.svelte.js";
    import * as CST from '../../constantes.js'
    import { writable } from 'svelte/store';
    import ConfigManager from "../configManager.svelte.js";
    import IconSelect from "./IconSelect.svelte";

    let { configManager, darkTheme = true } = $props();
    let listeId;
    let config = $state();

//     let colorsList = [
//     { colorName: 'grey', colorCode: "#808080" },
//     { colorName: 'black', colorCode: "#000000" },
//     { colorName: 'purple', colorCode: "#800080" },
//     { colorName: 'lightgreen', colorCode: "#90ee90" },
//     { colorName: 'darkgrey', colorCode: "#a9a9a9" }
// ];

    $effect(() => {
        listeId = configChangeEvent.current;
        config = configManager.selectedConfig[listeId];
    })

    function updateListName() {
        // configManager.selectedConfig[listeId].name = listName
        // configManager.selectedConfig.update(configEl => {
        //     configEl[listeId].name = config.name;   
        //     return configEl;
        // });
    }

    // function capitalizeFirstLetter(val) {
    //     return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    // }

    function updateConfig() {
        console.log("config.type.iconType", config.type.iconType)
        console.log("config.type.barType", config.type.barType)
        // console.log(configManager.selectedConfig[listeId])
        // configManager.selectedConfig.update(configEl => {
        //     configEl[listeId].behavior = config.behavior;
        //     configEl[listeId].style = config.style;
        //     configEl[listeId].type = config.type;
        //     return configEl;
        // });

    }
</script>

<div class="pannel-container">
    {#if config}
    <div class="pannel-header">
        <!-- svelte-ignore missing-declaration -->
        <input type="text" 
        name="liste-name" 
        id="liste-name" 
        bind:value={config.name} placeholder="Enter list name"
        oninput={updateListName} />
    </div>
    {#if config.behavior}
    <div class="pannel-body">
        <div class="bloc">
            <p>Behavior</p>
            <div class="row">
                <input type="checkbox" id="extendedOnStartup" bind:checked={config.behavior.extendedOnStartup} onchange={updateConfig} ><label for="extendedOnStartup">extendedOnStartup</label>
                <input type="checkbox" id="extendOnHover" bind:checked={config.behavior.extendOnHover} onchange={updateConfig}><label for="extendOnHover">extendOnHover</label>
            </div>
            <div class="row">
                <input type="checkbox" id="extendOnClick" bind:checked={config.behavior.extendOnClick} onchange={updateConfig}><label for="extendOnClick">extendOnClick</label>
                <input type="checkbox" id="isPinnable" bind:checked={config.behavior.isPinnable} onchange={updateConfig}><label for="isPinnable">isPinnable</label>
            </div>
        </div>
        <div class="bloc">
            <p>Style</p>
            <!-- <div class="row">
                <select name="header-size" id="header-size" bind:value={config.type.height} onchange={updateConfig}>
                    {#each CST.HEADER_TYPE_HEIGHT as headerHeight}
                        <option value={headerHeight.id}>{headerHeight.name}</option>
                    {/each}
                </select>
            </div> -->
            <div class="row">
                <IconSelect
                    bind:value={config.type.iconType}
                    options={CST.ICON_TYPE}
                    onchange={updateConfig}
                    darkTheme={darkTheme} />
            </div>
            <div class="row">
                <select name="bar-type" id="bar-type" bind:value={config.type.barType} onchange={updateConfig}>
                    <option value="">none</option>
                    {#each CST.BAR_TYPE as iconType}
                        <option value={iconType.id}>{iconType.color}</option>
                    {/each}
                </select>
            </div>
            <div class="row">
                <select name="bar-type" id="bar-type" bind:value={config.type.viewerCountType} onchange={updateConfig}>
                    <option value="">none</option>
                    {#each CST.COUNTER_TYPE as counterType}
                        <option value={counterType.id}>{counterType.name}</option>
                    {/each}
                </select>
            </div>
            <!-- <div class="row">
                <select name="theme" id="theme" bind:value={config.style.theme} onchange={updateConfig}>
                    <option value={CST.SYSTEM_STYLE}>System theme</option>
                    <option value={CST.CUSTOM_STYLE}>Custom</option>
                </select>
            </div> -->
            <!-- {#if config.style.theme === CST.CUSTOM_STYLE}
            <div class="row">
                <p>Header color</p>
                <select name="header-color" id="header-color" bind:value={config.style.header.headerColor} onchange={updateConfig}>
                    {#each colorsList as color}
                        <option value={color.colorCode}>
                            {capitalizeFirstLetter(color.colorName)}
                        </option>
                    {/each}
                </select>
                <input type="color" name="header-color" id="header-color"
                bind:value={config.style.header.headerColor} onchange={updateConfig}><label for="header-color"></label>
            </div>
            <div class="row">
                <p>Content color</p>
                <select name="header-color" id="header-color" bind:value={config.style.content.contentColor} onchange={updateConfig}>
                    {#each colorsList as color}
                    <option value={color.colorCode}>
                        {capitalizeFirstLetter(color.colorName)}
                    </option>
                    {/each}
                </select>
                <input type="color" name="header-color" id="content-color"
                bind:value={config.style.content.contentColor} onchange={updateConfig}><label for="content-color"></label>   
            </div>
            {/if} -->
        </div>
    </div>
    {/if}


    {/if}
</div>


<style>
    .pannel-container {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid grey;
        padding: 0.3em 0.8em;
    }
    .pannel-header {
        display: flex;
        flex-direction: row;
        padding: 0.3em .8em;
        background-color: rgb(116, 71, 26);
    }
    .pannel-header input {
        width: 90%;
    }
    .bloc {
        margin: 0.5em 1.5em;
        padding: 0.5em 1em;
        border: 1px solid grey;
        border-radius: .5em .5em .5em .5em;
    }
    .pannel-body {
        display: flex;
        flex-direction: column;
    }
    p {
        font-size: 1em;
        /* To keep the alignment when the p becomes an input */
        padding-bottom: 1px; 
    }
    input[type=text] {
        font-size: 1em;
        background: transparent;
        border: none;
        border-bottom: 1px solid #000000;
    }
    input[type="text"]:focus {
        outline: none;
    }
</style>