<script>
	let Saved = true;
	export let Location;
</script>

<div class="NavBar">
	<button
		on:click={() => {
			Location = "binsplash";
		}}
		class="NavButton"
	>
		<img class="Icon" src="./svg/Paintroller.svg" alt="monkey" />
		<div class="TabTitle">Splash</div>
	</button>
	<button
		on:click={() => {
			Location = "stitch";
		}}
		class="NavButton"
	>
		<img class="Icon" src="./svg/Stitch.svg" alt="monkey" />
		<div class="TabTitle">Stitch</div>
	</button>
	<button
		on:click={() => {
			Location = "bintex";
		}}
		class="NavButton"
	>
		<img class="Icon" src="./svg/ListBox.svg" alt="monkey" />
		<div class="TabTitle">BinTex</div>
	</button>
	<button
		on:click={() => {
			Location = "xrgba";
		}}
		class="NavButton"
	>
		<img class="Icon" src="./svg/Swatch.svg" alt="monkey" />
		<div class="TabTitle">xrgba</div>
	</button>
	<button
		on:click={() => {
			Location = "settings";
		}}
		class="NavButton"
	>
		<img class="Icon" src="./svg/Cog.svg" alt="monkey" />
		<div class="TabTitle">Settings</div>
	</button>
</div>

<style>
	.NavBar {
		overflow: hidden;
		position: fixed;
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: var(--bg-200);
		width: 3.75rem;
		transition: width 200ms ease-in-out;
		z-index: 100;
	}
	.NavBar:hover {
		width: 14rem;
	}
	.NavButton {
		border: none;
		width: 100%;
		background: none;
		z-index: 100;
	}
	.NavButton:enabled:hover {
		cursor: pointer;
		background: var(--bg-300);
	}
	.TabTitle {
		flex: 1;
		margin: auto;
		margin-left: 1rem;
		display: block;
	}
	.NavBar .Icon {
		height: 2rem;
		width: 2rem;
		aspect-ratio: 1;
	}
	.Icon {
		height: 1.5rem;
		width: 1.5rem;
		display: grid;
		place-items: center;
	}
	.NavButton:enabled .Icon {
		transition: transform 100ms ease-in-out;
		filter: grayscale(1);
	}
	.NavButton {
		display: flex;
		white-space: nowrap;
		background: none;
		text-align: start;
		padding-inline: 0.75rem;
		padding-block: 0.75rem;
		border: none;
		border-radius: 0.4rem;
		color: var(--text-primary);
	}

	.NavButton:last-of-type {
		margin-top: auto;
	}

	.NavButton:enabled:hover,
	.NavButton:disabled {
		background-color: var(--bg-300);
	}

	.NavButton:hover:enabled .Icon {
		transform: rotate(7deg) scale(1.1);
		filter: grayscale(0);
	}
	.NavButton:last-of-type {
		margin-top: auto;
	}
</style>
