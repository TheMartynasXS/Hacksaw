<script>
	import ColorContainer from 'components/ColorContainer.svelte';
	import ToggleButton from "components/ToggleButton.svelte";
	import DropDownButton from 'components/DropDownButton.svelte';
	
	import { settings, paletteStore } from "src/Stores";
	import _ from "lodash";

	let Hue = "";
	let Sat = "";
	let Lig = "";

	const handleClick = () => {
		window.api.selectFolder();
		window.api.receive((data) => {
			window.api.readDir(data).then(
				data =>{
					console.log(data)
				}
			)
		});
	};
</script>

<div class="Input-Group Margin-Bottom">
	<button
		class="Special-Input"
		on:click={() => {
			handleClick();
		}}>Open Bin</button
	>
	<span class="Label Flex-1" id="Title"><strong>Select a file</strong></span>
	<label class="Label" id="Title" for="Mode"
		><strong>Recoloring Mode:</strong></label
	>
	<select name="Mode" id="Mode" bind:value={$settings.PreferredMode}>
		<option value="random">Random</option>
		<option value="linear">Linear</option>
		<option value="wrap">Wrap</option>
	</select>
</div>
<ColorContainer />
<!-- <div class="Input-Group">
	<input
		class="Ellipsis Filter Flex-1"
		type="number"
		id="Hue"
		placeholder="Hue°"
		min="-360"
		max="360"
		bind:value={Hue}
	/>
	<input
		class="Ellipsis Filter Flex-1"
		type="number"
		id="saturation"
		placeholder="Saturation%"
		min="-100"
		max="100"
		bind:value={Sat}
	/>
	<input
		class="Ellipsis Filter Flex-1"
		type="number"
		id="saturation"
		placeholder="ligthness%"
		min="-100"
		max="100"
		bind:value={Lig}
	/>
	 <DropDownButton/> 
	
</div> -->
<div class="Flex Input-Group Margin-Top Margin-Bottom">
	<input
		type="checkbox"
		id="CheckToggle"
		class="CheckBox SettingOptionCheckbox"
	/>
	<input
		class="Ellipsis Flex-3 Filter"
		type="text"
		id="Filter"
		placeholder="Filter by Particle Name"
	/>
	<ToggleButton text="OC" bind:active={$settings.Targets[0]} />
	<ToggleButton text="RC" bind:active={$settings.Targets[1]} />
	<ToggleButton text="LC" bind:active={$settings.Targets[2]} />
	<ToggleButton text="BC" bind:active={$settings.Targets[3]} />
	<ToggleButton text="Main Color" bind:active={$settings.Targets[4]} />
	<!-- svelte-ignore a11y-label-has-associated-control -->
	<label class="Label" style="padding:0.5rem;text-align: center;"> BM</label>
	<button class="Special-Input ColorHelp">?</button>
</div>

<div class="Flex-1 Flex-Col Margin-Bottom" id="Particle-List" />

<div class="Input-Group">
	<button class="Flex-1">Undo</button>
	<button class="Flex-3" id="Recolor_Selected_Button">Recolor Selected</button
	>
</div>

<div class="Input-Group Margin-Top">
	<button class="Flex-1 Special-Input">Save Bin</button>
</div>
