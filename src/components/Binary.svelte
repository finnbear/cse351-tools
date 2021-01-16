<script context=module>
	import big from 'bigdecimal';

	function fmtBase(number, base, digits, prefix) {
		if (number == null) {
			if (digits < 1) {
				return '-';
			}
			return '-'.repeat(digits || 1);
		}
		let str = number.toString(base);
		const negative = str.startsWith('-');
		if (negative) {
			str = str.substring(1);
		}
		return (negative ? '-' : '') + prefix + str.padStart(digits, '0');
	}

	export function fmtBinary(number, bits, prefix = true) {
		return fmtBase(number, 2, bits, prefix ? '0b' : '');
	}

	export function fmtHex(number, hexDigits, prefix = true) {
		return fmtBase(number, 16, hexDigits, prefix ? '0x' : '');
	}

	export const FORM_UNSIGNED = 'unsigned';
	export const FORM_TWOS_COMPLEMENT = 'two\'s-complement';
	export const FORM_OPTIONS = [FORM_UNSIGNED, FORM_TWOS_COMPLEMENT];

	export const ENDIANNESS_IGNORED = 'ignored';
	export const ENDIANNESS_LITTLE = 'little';
	export const ENDIANNESS_BIG = 'big';
	export const ENDIANNESS_OPTIONS = [ENDIANNESS_IGNORED, ENDIANNESS_LITTLE, ENDIANNESS_BIG];

	export function getMinValue(size, form) {
		switch (form) {
			case FORM_UNSIGNED:
				return new big.BigInteger('0');
			case FORM_TWOS_COMPLEMENT:
				return (new big.BigInteger('2')).pow(size - 1).multiply(new big.BigInteger('-1'));
		}
	}

	export function getMaxValue(size, form) {
		switch (form) {
			case FORM_UNSIGNED:
				return (new big.BigInteger('2')).pow(size).add(new big.BigInteger('-1'));
			case FORM_TWOS_COMPLEMENT:
				return (new big.BigInteger('2')).pow(size - 1).add(new big.BigInteger('-1'));
		}
	}
</script>

<script>
	import Bit from './Bit.svelte';
	import Container from './Container.svelte';

	export let name = '';
	export let colspan = null;
	export let description = '';
	export let size = 1;
	export let form = FORM_UNSIGNED;
	export let endianness = ENDIANNESS_IGNORED;
	export let value = new big.BigInteger('0');
	export let fmt = (value, size) => `${fmtBinary(encodeForm(value, size, form), size)} = ${encodeForm(value, size, form)} = ${fmtHex(encodeForm(value, size, form), Math.ceil(size / 4))}`
	export let readOnly = false;
	export let onChange = null;

	$: value = value.max(getMinValue(size, form)).min(getMaxValue(size, form));

	function encodeForm(number, size, form) {
		switch (form) {
			case FORM_UNSIGNED:
				return number;
			case FORM_TWOS_COMPLEMENT:
				if (number.compareTo(new big.BigInteger('0')) >= 0) {
					// Positive numbers map cleanly to the unsigned range
					return number;
				}

				let complement = number.negate();
				for (let i = 0; i < size; i++) {
					complement = complement.flipBit(i);
				}
				complement = complement.add(new big.BigInteger('1'));
				complement = complement.clearBit(size + 1);
				return complement;
		}
	}

	function decodeForm(formedNumber, size, form) {
		switch (form) {
			case FORM_UNSIGNED:
				return formedNumber;
			case FORM_TWOS_COMPLEMENT:
				// Positive number fast-path
				if (formedNumber.compareTo(getMaxValue(size, form)) > 0) {
					let complement = formedNumber;
					for (let i = 0; i < size; i++) {
						complement = complement.flipBit(i);
					}
					return complement.add(new big.BigInteger('1')).negate();
				}
				return formedNumber;
		}
	}

	function getBit(number, size, form, position) {
		return encodeForm(number, size, form).testBit(position);
	}

	function updateBit(number, position, newValue) {
		if (newValue) {
			return number.setBit(position);
		}
		return number.clearBit(position);
	}

	function overflow(number) {
		return number.mod(getMaxValue(size, FORM_UNSIGNED).add(new big.BigInteger('1')));
	}

	function setValueBit(position, bitValue) {
		let encoded = encodeForm(value, size, form);
		encoded = updateBit(encoded, position, bitValue);
		value = decodeForm(encoded, size, form);
		onChange && onChange(value);
	}

	function getDisplayBits(value, size, form, endianness) {
		const bits = Array(size);
		for (let i = 0; i < size; i++) {
			let bitSignificance = size - 1 - i;
			if (endianness == ENDIANNESS_LITTLE) {
				let byte = Math.floor(bitSignificance / 8);
				const bytes = Math.ceil(size / 8);
				byte = bytes - 1 - byte;
				bitSignificance = byte * 8 + (bitSignificance % 8)
			}
			const bitValue = getBit(value, size, form, bitSignificance);
			bits[i] = {bitSignificance, bitValue};
		}
		return bits;
	}

	$: displayBits = getDisplayBits(value, size, form, endianness);

	export function shiftLeft() {
		let encoded = encodeForm(value, size, form);
		for (let i = size - 1; i > 0; i--) {
			encoded = updateBit(encoded, i, encoded.testBit(i - 1));
		}
		encoded = updateBit(encoded, 0, 0);
		value = decodeForm(encoded, size, form);
		onChange && onChange(value);
	}

	export function shiftRight() {
		let encoded = encodeForm(value, size, form);
		for (let i = 1; i < size; i++) {
			encoded = updateBit(encoded, i - 1, encoded.testBit(i))
		}
		if (form == FORM_TWOS_COMPLEMENT) {
			encoded = updateBit(encoded, size - 1, encoded.testBit(size - 2));
		} else {
			encoded = updateBit(encoded, size - 1, 0);
		}
		value = decodeForm(encoded, size, form);
		onChange && onChange(value);
	}

	export function increment() {
		let encoded = encodeForm(value, size, form);
		encoded = encoded.add(new big.BigInteger('1'));
		encoded = overflow(encoded);
		value = decodeForm(encoded, size, form);
		onChange && onChange(value);
	}
</script>

<Container {name} {description} {colspan}>
	{#if !readOnly}
		<div class=bits>
			{#each displayBits as {bitSignificance, bitValue}}
				<Bit
					significance={bitSignificance}
					value={bitValue}
					separateBytes={endianness != ENDIANNESS_IGNORED}
					onChange={bitValue => setValueBit(bitSignificance, bitValue)}
				/>
			{/each}
		</div>
	{/if}
	<p>{@html fmt(value, size)}</p>
</Container>

<style>
	div.bits {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}

	p {
		margin-bottom: 0;
		margin-top: 5px;
	}
</style>
