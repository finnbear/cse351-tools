// Returns the string with only the first letter of each word uppercased
export function toTitleCase(str) {
	str = str || '';
	const words = str.toLowerCase().split(' ');

	const processedWords = [];
	for (const word of words) {
		const processedWord = word.charAt(0).toUpperCase() + word.slice(1);
		processedWords.push(processedWord);
	}
	return processedWords.join(' ');
}

// Splits a string into an array of lines (no empty line at the end, even if
// the string end in a newline)
export function splitLines(str) {
	if (!str) {
		return [];
	}
	let lines = str.split(/\r?\n/g);
	if (lines.length > 0 && lines[lines.length - 1].length === 0) {
		// Remove last line (if empty)
		lines.pop();
	}
	return lines;
}

// Pluralizes a word based on whether count is 1 or something else.
// Not guaranteed to work for cases not used by existing callers.
export function plural(str, count) {
	if (count == 1) {
		return str;
	}
	if (str.endsWith('ss')) { // Misses (cache sim)
		return str + 'es';
	}
	return str + 's';
}
