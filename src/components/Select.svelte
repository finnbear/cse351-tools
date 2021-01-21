<script>
	import Container from './Container.svelte';
	import {toTitleCase} from '../utils/strings.js';

	export let name;
	export let colspan = null;
	export let description = '';
	export let disabled = null;
	export let options;
	export let value = '';
</script>

<Container {name} {description} {colspan}>
	<select {disabled} bind:value>
		{#each options as option}
			<option value={option}>{toTitleCase(option)}</option>
		{/each}
	</select>
</Container>

<style>
	select {
		border-radius: 5px;
		outline: 0;
		padding: 6px;
		width: calc(100% - 2px);
	}
</style>
