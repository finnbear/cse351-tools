<script>
	import Container from './Container.svelte';

	export let name;
	export let colspan = null;
	export let description = '';
	export let min = 0;
	export let max = 1;
	export let step = min == 0 && max == 1 ? 0.01 : 1;
	export let value = 0;
	export let disabled = false;
	export let tooltip = '';
	export let fmtValue = value => value;
	export let onChange = null;

	function onInput(e) {
		onChange && onChange(parseFloat(e.target.value));
	}
</script>

<Container name={`${name} (${fmtValue(value)})`} {description} {colspan}>
	<label title={tooltip}>
		<input type=range {disabled} {min} {max} {step} bind:value on:input={onInput}/>
	</label>
</Container>

<style>
	label {
		color: var(--text-color);
		user-select: none;
	}

	input {
		cursor: pointer;
		min-height: 30px;
		position: relative;
		vertical-align: middle;
		width: 100%;
	}
</style>
