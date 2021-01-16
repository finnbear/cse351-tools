<script>
	import {fmtBinary, fmtHex} from './Binary.svelte';
	import Container from './Container.svelte';
	import big from 'bigdecimal';

	export let name;
	export let colspan = null;
	export let description = '';
	export let disabled = null;
	export let value = new big.BigInteger('0');
	let format = fmtHex;

	function fmtDec(number) {
		return number == null ? '0' : number.toString();
	}

	let text = '';

	function parse(str) {
		text = str;

		if (str) {
			try {
				if (str.startsWith('0x')) {
					value = new big.BigInteger(str.substring(2) || '0', 16);
					format = fmtHex;
				}
				if (str.startsWith('0b')) {
					value = new big.BigInteger(str.substring(2) || '0', 2);
					format = fmtBinary;
				}
				value = new big.BigInteger(str);
				format = fmtDec;
			} catch (err) {}

			return;
		}

		value = new big.BigInteger('0');
		format = null;
	}
</script>

<Container {name} {description} {colspan}>
	<input type='text' {disabled} placeholder='0x00' value={format && value.compareTo(new big.BigInteger('0')) != 0 ? format(value) : text} on:input={e => parse(e.target.value)}/>
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
