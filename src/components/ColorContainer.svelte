<script>
	// @ts-nocheck

	import { paletteStore, settings } from '../Stores';
	import { ColorHandler } from '../Utilities';
	import { clickOutside } from '../events/clickOutside';

	let Count = 1;

	let indicatorColor = '';
	let Open = false;
	let genBg = () => {
		return $paletteStore.length > 1
			? `linear-gradient(0.25turn, ${$paletteStore.map((color) => color.ToHEX()).join(',')})`
			: $paletteStore[0].ToHEX();
	};

	$: {
		let Palette = $paletteStore;
		if (Count > Palette.length) {
			for (let i = Palette.length; i < Count; i++) {
				Palette.push(new ColorHandler());
			}
		} else if (Count < Palette.length) {
			Palette.splice(Count, Palette.length - Count);
		}
		paletteStore.set(Palette);
		indicatorColor = genBg();
	}
</script>

<div id="Slider-Container" class="Margin-Bottom Flex-Col" use:clickOutside
on:outsideclick={() => {
	Open = false;
}}>
	<input bind:value={Count} class="Range" id="Slider-Input" type="range" min="1" max="30" />
	{#if $settings.PreferredMode != 'random'}
		<div id="Gradient-Indicator" class="Flex" style={`background: ${indicatorColor};`} />
	{/if}

	<div id="Color-Container" class="Flex">
		{#each $paletteStore as Color}
			<input class="Color" type="color" value={Color.ToHEX()}
			on:input={(e) => {
				Color.InputHex(e.target.value)
				indicatorColor = genBg();
				}
			}/>
		{/each}
	</div>
</div>