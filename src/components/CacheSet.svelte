<script>
	import {getIndex, indexSize, getOffset, offsetSize, getTag, tagSize, WRITE_HIT_THROUGH, WRITE_MISS_NO_ALLOCATE, REPLACEMENT_LRU, REPLACEMENT_FIFO, REPLACEMENT_RANDOM} from './Cache.svelte';
	import {fmtBinary, fmtHex} from './Binary.svelte';
	import CacheLine from './CacheLine.svelte';

	export let selectedAddress;
	export let addressSize;
	export let cacheSize;
	export let associativity;
	export let blockSize;
	export let writeHit;
	export let writeMiss;
	export let replacement;

	// Array of refs (WARNING: May contain invalid data if set size is decreased,
	// which never happens as sets are recreated when that happens)
	let lines = [];

	// Monotonic counter for LRU, FIFO, etc.
	let counter = 0;

	function getLine(address) {
		const tag = getTag(address, addressSize, cacheSize, blockSize, associativity);
		return lines.find(line => line.getLineTag() == tag);
	}

	function minLine(key) {
		let min = Infinity;
		let line = lines[0];
		for (const l of lines) {
			if (l[key] < min) {
				line = l;
				min = l[key];
			}
		}
		return line;
	}

	function allocateLine(memory, address) {
		let line = lines.find(line => !line.isValid());

		if (!line) {
			switch (replacement) {
				case REPLACEMENT_LRU:
					line = minLine('use'); // least recently USEd
					break;
				case REPLACEMENT_FIFO:
					line = minLine('in'); // first IN first out
					break;
				case REPLACEMENT_RANDOM:
					// TODO: Seed random in a repeatable way
					line = lines[Math.floor(Math.random() * lines.length)];
					break;
			}
		}

		if (line.isDirty()) {
			line.flush(memory);
		}

		line.load(memory, address);

		counter++;
		line.in = counter;

		return line;
	}

	// Updates LRU
	function accessLine(line) {
		counter++;
		line.use = counter;
	}

	// Helper function to format the tag of an address (not reactive to other
	// parameters)
	function fmtTag(address) {
		const size = tagSize(addressSize, cacheSize, blockSize, associativity);
		if (size > 0) {
			return fmtBinary(getTag(address, addressSize, cacheSize, blockSize, associativity), size);
		}
		return "N/A";
	}

	// Helper function to format the index of an address (not reactive to other
	// parameters)
	function fmtIndex(address) {
		const index = getIndex(address, cacheSize, blockSize, associativity);
		const size = indexSize(cacheSize, blockSize, associativity);
		return fmtBinary(index, size)
	}

	// Helper function to format the offset of an address (not reactive to other
	// parameters)
	function fmtOffset(address) {
		return fmtBinary(getOffset(address, blockSize), offsetSize(blockSize));
	}

	// Uses yield keyboard to return step by step status information without
	// extra context-switching logic
	export function* read(memory, address, log, updateStats) {
		yield `Tag identified as ${fmtTag(address)}`;
		yield `Set index identified as ${fmtIndex(address)}`;
		yield `Offset within cache line identified as ${fmtOffset(address)}`;

		let line = getLine(address);

		log(`R(${fmtHex(address, addressSize / 4)}) = ${line ? 'H' : 'M'}`)
		updateStats(line);
		yield line ? 'Hit cache' : 'Missed cache';

		if (!line) {
			line = allocateLine(memory, address, log);
			yield 'Allocated cache line';
		}

		accessLine(line);
		if (associativity > 1 && replacement === REPLACEMENT_LRU) {
			yield 'Updated LRU';
		}

		const offset = getOffset(address, blockSize);
		return line.read(offset);
	}

	export function* write(memory, address, byte, log, updateStats) {
		yield `Tag identified as ${fmtTag(address)}`;
		yield `Set index identified as ${fmtIndex(address)}`;
		yield `Offset within cache line identified as ${fmtOffset(address)}`;

		let line = getLine(address);

		log(`W(${fmtHex(address, addressSize / 4)}, ${fmtHex(byte, 2)}) = ${line ? 'H' : 'M'}`);
		updateStats(line);
		yield line ? 'Hit cache' : 'Missed cache';

		if (!line) {
			if (writeMiss == WRITE_MISS_NO_ALLOCATE) {
				memory.write(address, byte);
				yield 'Wrote through to memory';
				return;
			}

			line = allocateLine(memory, address, log);
			yield 'Allocated cache line';
		}

		accessLine(line);
		if (associativity > 1 && replacement === REPLACEMENT_LRU) {
			yield 'Updated LRU';
		}

		const offset = getOffset(address, blockSize);

		if (writeHit == WRITE_HIT_THROUGH) {
			line.write(offset, byte, false);
			yield 'Wrote to cache';
			memory.write(address, byte);
			yield 'Wrote through to memory';
		} else {
			line.write(offset, byte);
			yield 'Wrote to cache';
		}
	}

	// Flush all dirty lines to memory
	export function flush(memory, log) {
		for (const line of lines) {
			if (line.isDirty()) {
				line.flush(memory);
			}
		}
	}

	// Clear all lines
	export function clear() {
		for (const line of lines) {
			line.clear();
		}
	}
</script>

{#each Array(associativity) as _, lineIndex}
	<CacheLine bind:selectedAddress {addressSize} {cacheSize} {associativity} {blockSize} {writeHit} bind:this={lines[lineIndex]}/>
{/each}
