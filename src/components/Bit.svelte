<script>
	import {BigInteger} from 'bigdecimal';

	export let significance = 0;
	export let value = false;
	export let separateBytes = false;
	export let onChange = null;

	function toggleValue() {
		value = !value;
		onChange && onChange(value);
	}
</script>

<button title={(new BigInteger('1')).shiftLeft(significance)} class:set={value} class:separate={separateBytes && significance % 8 == 0} on:click={toggleValue}>{value ? 1 : 0}</button>

<style>
	button {
		background-color: lightgray;
		border: 1px solid gray;
		border-radius: 5px;
		filter: brightness(0.6);
		outline: none;
		padding: 3px 8px;
		user-select: none;
	}

	button:hover {
		filter: brightness(0.7);
	}

	button.set:hover {
		filter: brightness(0.9);
	}

	button.set {
		filter: brightness(1);
	}

	button.separate {
		margin-right: 5px;
	}
</style>
