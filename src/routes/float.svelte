<script context=module>
	import {BigDecimal, BigInteger} from 'bigdecimal';
	import {maxUnsigned} from '../utils/math.js';

	// Handles fractional binary and (de)normalization
	function decodeMantissa(mantissaSize, mantissaValue, exponentSize, exponentValue) {
		// Normalized vs. Denormalized checked here
		let mantissa = new BigDecimal(exponentValue.compareTo(new BigInteger('0')) == 0 ? '0' : '1');

		// Convert to string and process 1 and 0 characters (there may be a better way)
		const mantissaBitsString = mantissaValue.toString(2).padStart(mantissaSize, '0');
		for (let i = 0; i < mantissaBitsString.length; i++) {
			if (mantissaBitsString[i] == '1') {
				mantissa = mantissa.add((new BigDecimal('0.5')).pow(i + 1));
			}
		}
		return mantissa;
	}

	// Returns a BigDecimal of 2^power for any integer power
	function powerOf2(power) {
		if (power >= 0) {
			return (new BigDecimal('2')).pow(power);
		}
		// BigDecimal's pow doesn't support negative powers, so find it manually
		return (new BigDecimal('1')).divide((new BigDecimal('2')).pow(-power));
	}

	// Returns the max representable value of a float with the given exponent
	// and mantissa sizes
	function maxValue(exponentSize, mantissaSize) {
		return powerOf2(exponentBias(exponentSize)).multiply((new BigDecimal('2')).subtract((new BigDecimal('1')).divide(powerOf2(mantissaSize))));
	}

	// Takes a string and encodes it to an a sign, exponent, and mantissa
	function encodeStr(value, exponentSize, mantissaSize) {
		const sign = new BigInteger(value.startsWith('-') ? '1' : '0');

		let parsed;
		try {
			 parsed = (new BigDecimal(value)).abs();
		} catch (err) {
			// infinity and -infinity are the only non-number cases that are not NaN
			if (value.toLowerCase() == 'infinity' || value.toLowerCase() == '-infinity') {
				return {sign, exponent: new BigInteger(`${maxUnsigned(exponentSize)}`), mantissa: new BigInteger('0')};
			}

			// NaN
			return {sign, exponent: new BigInteger(`${maxUnsigned(exponentSize)}`), mantissa: new BigInteger('1')};
		}

		// Zero
		if (parsed.compareTo(new BigDecimal('0')) == 0) {
			return {sign, exponent: new BigInteger('0'), mantissa: new BigInteger('0')};
		}

		// Infinities
		if (parsed.compareTo(maxValue(exponentSize, mantissaSize)) > 0) {
			return {sign, exponent: new BigInteger(`${maxUnsigned(exponentSize)}`), mantissa: new BigInteger('0')};
		}

		// Find exponent (log base 2)
		let ln2 = 0;
		const oneCmp = parsed.compareTo(new BigDecimal('1'));
		let tmp = parsed;
		if (oneCmp > 0) { // greater than one
			ln2--;
			while (tmp.compareTo(new BigDecimal('1')) >= 0) {
				tmp = tmp.divide(new BigDecimal('2'));
				ln2++;
			}
		} else if (oneCmp < 0) { // less than one
			while (tmp.compareTo(new BigDecimal('1')) < 0) {
				tmp = tmp.multiply(new BigDecimal('2'));
				ln2--;
			}
		}

		let exponent, mantissaDecimal;

		if (ln2 >= 1 - exponentBias(exponentSize)) {
			// Normalized
			exponent = new BigInteger(`${ln2 + exponentBias(exponentSize)}`);
			mantissaDecimal = parsed.multiply(powerOf2(mantissaSize - ln2)).subtract(powerOf2(mantissaSize));
		} else {
			// Denormalized
			exponent = new BigInteger('0');
			mantissaDecimal = parsed.divide(powerOf2(1 - exponentBias(exponentSize) - mantissaSize));
		}

		let mantissa = mantissaDecimal.toBigInteger();

		// Round mantissa
		if (mantissaDecimal.subtract(new BigDecimal(mantissa.toString())).compareTo(new BigDecimal('0.5')) >= 0) {
			mantissa = mantissa.add(new BigInteger('1'));
		}

		return {sign, exponent, mantissa};
	}

	// Returns a type that is stringifyable and, if possible, a BigDecimal,
	// based on the sign, exponent, and mantissa. The stringifyable type is
	// used to guarantee that all special cases are displayable (even if they
	// cannot be represented by a BigDecimal e.g. Infinity)
	function decode(signValue, exponentSize, exponentValue, mantissaSize, mantissaValue) {
		const negative = signValue.compareTo(new BigInteger('1')) == 0;
		const sign = new BigDecimal(negative ? '-1' : '1');
		const mantissa = decodeMantissa(mantissaSize, mantissaValue, exponentSize, exponentValue);

		// Use a string of bits to decode the exponent
		let exponent = 0;
		const exponentBitsString = exponentValue.toString(2);
		for (let i = 0; i < exponentBitsString.length; i++) {
			if (exponentBitsString[i] == '1') {
				exponent += Math.pow(2, exponentBitsString.length - 1 - i);
			}
		}

		// Zero
		if (exponent == 0 && mantissaValue.compareTo(new BigDecimal('0')) == 0) {
			// BigDecimal cannot encode negative zero
			const bigZero = new BigDecimal('0');
			return {str: negative ? '-0' : '0', big: bigZero, exponent: 'Zero', mantissa: 'Zero'};
		}

		// Infinity
		if (exponent == maxUnsigned(exponentSize) && mantissaValue.compareTo(new BigDecimal('0')) == 0) {
			// BigDecimal has no concept of infinity
			return {str: negative ? '-Infinity' : 'Infinity', exponent: 'All Ones', mantissa: 'Zero'};
		}

		// NaN
		if (exponent == maxUnsigned(exponentSize) && mantissaValue.compareTo(new BigDecimal('0')) != 0) {
			// BigDecimal has no concept of NaN
			return {str: 'NaN', exponent: 'All Ones', mantissa: 'Non-Zero'};
		}

		// Denormalization
		if (exponent == 0) {
			// Denormalized, mantissa has already been calculated as such
			// only need to fix exponent
			exponent = 1;
		}

		// Exponent bias
		exponent -= exponentBias(exponentSize);

		// Calculate final result
		const result = sign.multiply(mantissa.multiply(powerOf2(exponent))).stripTrailingZeros();

		// Representable by BigDecimal so simply use result.toString() for str
		return {str: result.toString(), big: result, exponent, mantissa};
	}

	// Returns a new BigInteger represeting the combined bits of the sign,
	// exponent, and mantissa (expressed as an unsigned value)
	function combineBits(sign, exponentSize, exponent, mantissaSize, mantissa) {
		return sign.shiftLeft(mantissaSize + exponentSize).or(exponent.shiftLeft(mantissaSize)).or(mantissa);
	}

	// Returns the exponent bias for a given exponent size, such as 127 in the
	// case of an 8 bit exponent
	function exponentBias(exponentSize) {
		return maxUnsigned(exponentSize - 1);
	}
</script>

<script>
	import Binary from '../components/Binary.svelte';
	import Container from '../components/Container.svelte';
	import Text from '../components/Text.svelte';
	import Slider from '../components/Slider.svelte';

	// Encoded values
	let sign = new BigInteger('0');
	let exponent = new BigInteger('0');
	let mantissa = new BigInteger('0');

	// Text input of decimal target value
	let textValue = '';

	// Encoding parameters
	let mantissaSize = 23;
	let exponentSize = 8;

	// Changing bits of the float invalidates the decimal target value text
	function clearText() {
		textValue = '';
	}

	// Keeps combinedBits up to date by running every time any parameter changes
	$: combinedBits = combineBits(sign, exponentSize, exponent, mantissaSize, mantissa);

	// Keeps decoded up to date by running every time any parameter changes
	$: decoded = decode(sign, exponentSize, exponent, mantissaSize, mantissa);

	// Process text input when it changes, or when a related parameter changes
	$: {
		if (textValue) {
			const encoded = encodeStr(textValue, exponentSize, mantissaSize);
			sign = encoded.sign;
			exponent = encoded.exponent;
			mantissa = encoded.mantissa;
		}
	}
</script>

<table>
	<tr>
		<Binary name='Sign Bit' size={1} fmt={sign => sign.compareTo(new BigInteger('1')) == 0 ? 'Negative' : 'Positive'} bind:value={sign} onChange={clearText}/>
	</tr>
	<tr>
		<Slider name='Exponent Size' description='The size, in bits, of the exponent' min={1} max={11} bind:value={exponentSize}/>
	</tr>
	<tr>
		<Binary name='Exponent Value' size={exponentSize} fmt={() => decoded.exponent} bind:value={exponent} onChange={clearText}/>
	</tr>
	<tr>
		<Slider name='Mantissa Size' description='The size, in bits, of the mantissa' min={1} max={52} bind:value={mantissaSize}/>
	</tr>
	<tr>
		<Binary name='Mantissa Value' size={mantissaSize} fmt={() => decoded.mantissa} bind:value={mantissa} onChange={clearText}/>
	</tr>
	<tr>
		<Binary name={`Combined Bits (${1 + exponentSize + mantissaSize})`} size={1 + exponentSize + mantissaSize} value={combinedBits} readOnly={true}/>
	</tr>
	<tr>
		<Text name='Decimal Target Value' description='The sign, exponent, and mantissa will be changed to reach or approach this value' bind:value={textValue}/>
	</tr>
	<tr>
		<Container name={`Exact Value Represented By Float`} description='The exact value represented by the sign, exponent, and mantissa'><span><b>{decoded.str}</b></span></Container>
	</tr>
	{#if textValue && decoded.big}
		<tr>
			<Container name={`Conversion Error From Target Value`} description={'The exact value of the float minus the target value'}><span>{decoded.big.subtract(new BigDecimal(textValue))}</span></Container>
		</tr>
	{/if}
</table>

<style>
	span {
		overflow-wrap: anywhere;
	}
</style>
