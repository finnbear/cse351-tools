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

export function plural(str, count) {
	if (count == 1) {
		return str;
	}
	if (str.endsWith('ss')) { // Misses (cache sim)
		return str + 'es';
	}
	return str + 's';
}
