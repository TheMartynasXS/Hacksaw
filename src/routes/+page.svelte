<script>
	const sendHelloMessageToElectron = () => {
		const someData = {
			name: "Svelte",
		};

		window.api.send("hello", someData);
	};

	window.api.on("world", (e, data) => {
		// Handle "world" message from Electron
	});
</script>

<!-- <script>
	import NavBar from "components/NavBar.svelte";

	import BinSplash from "src/routes/BinSplash.svelte";
	import Stitch from "src/routes/Stitch.svelte";

	let Location = "binsplash";
</script>

<NavBar bind:Location />

<div class="content">
	{#if Location == "binsplash"}
		<BinSplash />
	{:else if Location == "stitch"}
		<Stitch />
	{/if}
</div>

<style>
	.content {
		margin-left: 3.75rem;
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
	}
</style> -->
