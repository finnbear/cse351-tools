<script>
	import Container from './Container.svelte';

	export let name;
	export let colspan = null;
	export let description = '';
	export let disabled = false;
</script>

<Container {name} {description} {colspan}>
	<button class:disabled {disabled} on:click>
		<slot>{name}</slot>
	</button>
</Container>

<style>
	button {
		background-color: var(--text-color);
		border-radius: 5px;
		padding: 7px 6px;
		width: 100%;
	}

	button:hover:not(.disabled) {
		filter: brightness(0.9);
	}
</style>
