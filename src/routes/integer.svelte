<script>
	import Binary, {ENDIANNESS_OPTIONS, ENDIANNESS_IGNORED, FORM_OPTIONS, FORM_UNSIGNED, fmtHex, getMaxValue, getMinValue} from '../components/Binary.svelte';
	import Button from '../components/Button.svelte';
	import Container from '../components/Container.svelte';
	import Integer from '../components/Integer.svelte';
	import Select from '../components/Select.svelte';
	import OptionsSlider from '../components/OptionsSlider.svelte';
	import big from 'bigdecimal';

	// Parameters
	let size = 8; // bits
	let endianness = ENDIANNESS_IGNORED;
	let form = FORM_UNSIGNED;

	// Value stored by the integer (signed or unsigned, depending on form)
	let value = new big.BigInteger('0');

	// Function bindings
	let increment;
	let shiftLeft;
	let shiftRight;
</script>

<table>
	<tr>
		<OptionsSlider name='Size' description='The size, in bits, of the integer' options={[4, 8, 16, 32, 64]} bind:value={size} slider={false}/>
		<Select name='Form' description='The integer value encoding scheme' bind:value={form} options={FORM_OPTIONS}/>
		<Select name='Endianness' description='The order of the bytes in memory' disabled={size <= 8} bind:value={endianness} options={ENDIANNESS_OPTIONS}/>
	</tr>
	<tr>
		<Binary colspan={3} name='Bits' {size} {form} endianness={size > 8 ? endianness : ENDIANNESS_IGNORED} bind:value bind:increment bind:shiftLeft bind:shiftRight/>
	</tr>
	<tr>
		<Button name='Increment' description='Adds 1 to the binary representation' on:click={increment}/>
		<Button name='Shift Left' description='Computes value << 1' on:click={shiftLeft}/>
		<Button name='Shift Right' description='Computes value >> 1' on:click={shiftRight}/>
	</tr>
	<tr>
		<Integer colspan={3} name='Target Value' description='The bits will be changed to reach or approach this value' bind:value/>
	</tr>
	<tr>
		<Container colspan={3} name='Value Represented By Integer' description={`The integer value represented by the bits  (Min: ${getMinValue(size, form)}, Max: ${getMaxValue(size, form)})`}>
			<span><b>{value}</b></span>
		</Container>
	</tr>
</table>
