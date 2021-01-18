<script>
	import {fmtBinary, fmtHex} from './Binary.svelte';
	import Container from './Container.svelte';
	import {BigInteger} from 'bigdecimal';

	export let name;
	export let colspan = null;
	export let description = '';
	export let disabled = null;
	export let value = new BigInteger('0');

	// Maintain the user's preferred format (a function that formats a number
	// to a string)
	let format = fmtHex;

	function fmtDec(number) {
		return number == null ? '0' : number.toString();
	}

	let text = '';

	// Parse the user input string to a BigInteger and set the preferred format
	function parse(str) {
		text = str;

		if (str) {
			try {
				if (str.startsWith('0x')) {
					value = new BigInteger(str.substring(2) || '0', 16);
					format = fmtHex;
				}
				if (str.startsWith('0b')) {
					value = new BigInteger(str.substring(2) || '0', 2);
					format = fmtBinary;
				}
				value = new BigInteger(str);
				format = fmtDec;
			} catch (err) {}

			return;
		}

		value = new BigInteger('0');
		format = null;
	}
</script>

<Container {name} {description} {colspan}>
	<input type='text' {disabled} placeholder='0x00' value={format && value.compareTo(new BigInteger('0')) != 0 ? format(value) : text} on:input={e => parse(e.target.value)}/>
</Container>

<style>
	input {
		border: 1px solid gray;
		border-radius: 5px;
		outline: 0;
		padding: 7px 6px;
		width: calc(100% - 16px);
	}
</style>
