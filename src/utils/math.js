// Math functions in this file operate on Numbers, not BigIntegers.

// Returns log base 2 of the given number
export function log2(number) {
	return Math.log(number) / Math.LN2;
}

// Return the maximum value representable by an unsigned integer of the
// given size
export function maxUnsigned(bits) {
	return Math.pow(2, bits) - 1;
}
