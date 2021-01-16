<script>
	import {fmtHex} from './Binary.svelte';

	export let title = () => null;
	export let bytes = [];
	export let highlighted = () => false;
	export let colored = () => false;
	export let onClick = () => {};
</script>

{#each bytes as byte, byteIndex}
	<td class:highlighted={highlighted(byteIndex)} class:colored={colored(byteIndex)} on:click={() => onClick(byteIndex)} title={title(byteIndex)}>{fmtHex(byte, 2, false)}</td>
{/each}

<style>
	td {
		border: 2px solid var(--text-contrast-color);
		color: var(--text-secondary-color);
		font-weight: bold;
		text-align: center;
	}

	td:hover {
		filter: brightness(1.25);
	}

	td:hover:not(.highlighted) {
		cursor: pointer;
	}

	td.highlighted {
		color: var(--text-color);
	}

	td.colored {
		filter: sepia(100%);
	}
</style>
