<script>
	import Container from './Container.svelte';

	export let name;
	export let colspan = null;
	export let description = '';
	export let value = '';
</script>

<Container {name} {description} {colspan}>
	<input type='text' bind:value/>
</Container>

<style>
	input {
		border-radius: 5px;
		outline: 0;
		padding: 7px 6px;
		width: calc(100% - 16px);
	}
</style>
