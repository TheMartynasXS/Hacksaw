<script>
	export let text = ""
    export let active = false;
</script>

<style>
    .Toggle{
        cursor: pointer;
        background-color: var(--bg-200);
        color: var(--text-primary);
    }
    .Toggle:hover{
        background-color: var(--accent);
        color: black;
    }
    .active{
        background-color: var(--text-secondary);
        color: black;
    }
</style>

<button class="Label Toggle" class:active={active == true} on:click={()=>{active = !active}} style="padding:0.4rem;">
    {text}
</button>
