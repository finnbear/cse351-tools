<script context='module'>
	import {fmtHex} from './Binary.svelte';
	import {log2} from '../scripts/math.js';

	export const wordSize = 8; // bytes

	function maxUnsigned(bits) {
		return Math.pow(2, bits) - 1;
	}

	export function cacheLineCount(cacheSize, blockSize) {
		return cacheSize / blockSize;
	}

	export function cacheSetCount(cacheSize, blockSize, associativity) {
		return cacheLineCount(cacheSize, blockSize) / associativity;
	}

	export function offsetSize(blockSize) {
		return log2(blockSize);
	}

	export function indexSize(cacheSize, blockSize, associativity) {
		return log2(cacheSetCount(cacheSize, blockSize, associativity));
	}

	export function tagSize(addressSize, cacheSize, blockSize, associativity) {
		return Math.max(0, addressSize - indexSize(cacheSize, blockSize, associativity) - offsetSize(blockSize));
	}

	export function getOffset(address, blockSize) {
		if (address == null) {
			return null;
		}
		return address % blockSize;
	}

	export function getIndex(address, cacheSize, blockSize, associativity) {
		if (address == null) {
			return null;
		}
		return (address >> offsetSize(blockSize)) % Math.pow(2, indexSize(cacheSize, blockSize, associativity));
	}

	export function getTag(address, addressSize, cacheSize, blockSize, associativity) {
		if (address == null) {
			return null;
		}
		return address >> (indexSize(cacheSize, blockSize, associativity) + offsetSize(blockSize));
	}

	export const WRITE_HIT_BACK = 'write back';
	export const WRITE_HIT_THROUGH = 'write through';
	export const WRITE_HIT_OPTIONS = [WRITE_HIT_BACK, WRITE_HIT_THROUGH];

	export const WRITE_MISS_ALLOCATE = 'write-allocate';
	export const WRITE_MISS_NO_ALLOCATE = 'no write-allocate';
	export const WRITE_MISS_OPTIONS = [WRITE_MISS_ALLOCATE, WRITE_MISS_NO_ALLOCATE];

	export const REPLACEMENT_LRU = 'least recently used';
	export const REPLACEMENT_RANDOM = 'random';
	export const REPLACEMENT_FIFO = 'round-robin (fifo)';
	export const REPLACEMENT_OPTIONS = [REPLACEMENT_LRU, REPLACEMENT_RANDOM, REPLACEMENT_FIFO];

	export const EXPLAIN_ON = 'on';
	export const EXPLAIN_OFF = 'off';
	export const EXPLAIN_OPTIONS = [EXPLAIN_ON, EXPLAIN_OFF];
</script>

<script>
	import CacheSet from './CacheSet.svelte';
	import Container from './Container.svelte';

	export let name = 'Cache';
	export let colspan = null;
	export let selectedAddress = null;
	export let addressSize = 8;
	export let cacheSize = 8;
	export let blockSize = 8;
	export let associativity = 1;
	export let writeHit = WRITE_HIT_BACK;
	export let writeMiss = WRITE_MISS_ALLOCATE;
	export let replacement = REPLACEMENT_LRU;
	export let hits = 0;
	export let misses = 0;

	export let sets = [];

	function getSet(address) {
		const setIndex = getIndex(address, cacheSize, blockSize, associativity);
		return sets[setIndex];
	}

	function updateStats(hit) {
		if (hit) {
			hits++;
		} else {
			misses++;
		}
	}

	function validAddress(address) {
		if (address == null) {
			return false;
		}
		if (address < 0 || address > maxUnsigned(addressSize)) {
			return false;
		}
		return true;
	}

	export function read(memory, address, log) {
		if (!validAddress(address)) {
			return;
		}
		const set = getSet(address);
		if (!set) {
			log('Error: cache is not available');
			return;
		}
		return set.read(memory, address, log, updateStats);
	}

	export function write(memory, address, byte, log) {
		if (!validAddress(address)) {
			return;
		}
		const set = getSet(address);
		if (!set) {
			log('Error: cache is not available');
			return;
		}
		return set.write(memory, address, byte, log, updateStats);
	}

	export function flush(memory, log) {
		for (const set of sets) {
			if (set) {
				set.flush(memory, log);
			}
		}
		log("Cache flushed")
	}

	export function clear(log) {
		for (const set of sets) {
			if (set) {
				set.clear();
			}
		}
		log("Cache cleared");
	}

	export function reset() {
		hits = 0;
		misses = 0;
		clear(() => {});
	}
</script>

<Container {name} {colspan}>
	{#if cacheSetCount(cacheSize, blockSize, associativity) < 1}
		<p>Cache Size is too small for the specified Block Size and Associativity</p>
	{:else}
		<div>
			<table>
				<thead>
					<tr>
						<th>Valid</th>
						{#if writeHit == WRITE_HIT_BACK}
							<th>Dirty</th>
						{/if}
						{#if tagSize(addressSize, cacheSize, blockSize, associativity) > 0}
							<th>Tag</th>
						{/if}
						<th colspan={blockSize}>Data</th>
					</tr>
				</thead>
				<tbody>
					{#key addressSize + cacheSize + associativity + blockSize}
						{#each Array(cacheSetCount(cacheSize, blockSize, associativity)) as _, setIndex}
							{#if setIndex > 0}
								<tr class=spacer/>
							{/if}
							<CacheSet bind:selectedAddress {addressSize} {cacheSize} {associativity} {blockSize} {writeHit} {writeMiss} {replacement} bind:this={sets[setIndex]}/>
						{/each}
					{/key}
				</tbody>
			</table>
		</div>
	{/if}
</Container>

<style>
	div {
		height: 300px;
		overflow-y: auto;
	}

	table {
		border-collapse: collapse;
		width: 100%;
	}

	tbody {
		line-height: 0.75;
	}

	tr.spacer {
		height: 10px;
	}
</style>
