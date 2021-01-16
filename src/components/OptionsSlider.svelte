<script>
	import Select from './Select.svelte';
	import Slider from './Slider.svelte';

	export let name;
	export let colspan = null;
	export let description = '';
	export let options;
	export let index = 0;
	export let value;
	let selectText = value ? value.toString() : '';
	export let slider = true;

	$: {
		if (slider) {
			if (Array.isArray(options)) {
				value = options[index];
			}
		} else if (selectText) {
			value = parseInt(selectText);
		}
	}
</script>

{#if slider}
	<Slider {name} {description} {colspan} min={0} max={options.length - 1} bind:value={index} fmtValue={value => options[value]}/>
{:else}
	<Select {name} {description} {colspan} options={options.map(num => num.toString())} bind:value={selectText}/>
{/if}
