<script>
	import {afterUpdate} from 'svelte';
	import Container from './Container.svelte';

	export let name = 'Log';
	export let colspan = null;
	export let rowspan = null;
	export let description = '';

	// TODO: Investigate whether using an array of lines is better than a string
	// with newlines
	export let value = '';

	export function log(line) {
		value += line + '\n';
	}

	let textArea; // ref

	afterUpdate(() => {
		if (textArea) {
			// Always scroll to the bottom
			textArea.scrollTop = textArea.scrollHeight;
		}
	});
</script>

<Container {name} {description} {colspan} {rowspan}>
	<textarea bind:value bind:this={textArea}/>
</Container>

<style>
	textarea {
		box-sizing: border-box;
		min-height: 150px;
		resize: none;
		width: 100%;
	}
</style>
