<script>
	export let name;
	export let colspan = null;
	export let rowspan = null;
	export let description = '';
</script>

<td {colspan} {rowspan}>
	<h3>{name}</h3>
	<slot/>
	{#if description}
		<br/>
		<small>{description}</small>
	{/if}
</td>

<style>
	td {
		background-color: var(--text-secondary-contrast-color);
		border-radius: 5px;
		margin: 2.5px;
		padding: 5px;
		vertical-align: top;
	}

	h3 {
		user-select: none;
	}

	small {
		color: var(--text-secondary-color);
	}
</style>
