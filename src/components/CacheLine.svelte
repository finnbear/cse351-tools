<script context='module'>
	// Returns an array with count of item
	function arrayOf(count, item) {
		const arr = [];
		for (let i = 0; i < count; i++) {
			arr.push(item);
		}
		return arr;
	}

	function boolToBit(bool) {
		return bool ? '1' : '0';
	}
</script>

<script>
	import {fmtBinary, fmtHex} from './Binary.svelte';
	import {getTag, tagSize, WRITE_HIT_BACK} from './Cache.svelte';
	import MemoryData from './MemoryData.svelte';

	export let selectedAddress;
	export let addressSize;
	export let cacheSize;
	export let associativity;
	export let blockSize;
	export let writeHit;

	let address = null;
	let data = [];
	let dataDirty;

	// Sets the dirty flag for a given offset to a given new value
	function setDirty(offset, newValue) {
		dataDirty[offset] = newValue;
		dataDirty = dataDirty; // trigger Svelte update
	}

	// Returns true if all elements are non-null
	function allNonNull(arr) {
		return arr.every(item => item != null);
	}

	// Exported function for querying if line is valid
	export function isValid() {
		return allNonNull(data);
	}

	// Return true if all elements are truthy
	function anyTrue(arr) {
		return arr.some(val => val);
	}

	// Exported function for querying if line is dirty
	export function isDirty() {
		return anyTrue(dataDirty) && isValid();
	}

	// Exported function for querying the tag of the line based on its address
	// Returns null if address does not exist
	export function getLineTag() {
		return getTag(address, addressSize, cacheSize, blockSize, associativity);
	}

	// Reads a byte of data at the offset
	export function read(offset) {
		return data[offset];
	}

	// Writes a byte of data at the offset (setting the cooresponding dirty flag
	// by default)
	export function write(offset, byte, makeDirty = true) {
		data[offset] = byte;
		if (makeDirty) {
			setDirty(offset, true);
		}
	}

	// Aligns an address to the block size
	function align(address) {
		return Math.floor(address / blockSize) * blockSize;
	}

	// Populates the cache line from memory
	export function load(memory, addr) {
		address = align(addr);
		for (let offset = 0; offset < blockSize; offset++) {
			write(offset, memory.read(address + offset), false);
			setDirty(offset, false);
		}
	}

	// Flushes the cache line to memory
	export function flush(memory) {
		if (address == null || !isValid()) {
			return;
		}
		for (let offset = 0; offset < blockSize; offset++) {
			memory.write(address + offset, read(offset));
			setDirty(offset, false);
		}
	}

	// Clears the cache line, making it invalid
	export function clear() {
		address = null;
		data = arrayOf(blockSize, null);
		dataDirty = arrayOf(blockSize, false);
	}

	// trigger clear on blockSize change
	$: clear(blockSize);
</script>

<tr>
	<td class='v'>{boolToBit(allNonNull(data))}</td>
	{#if writeHit == WRITE_HIT_BACK}
		<td class='d'>{boolToBit(anyTrue(dataDirty))}</td>
	{/if}
	{#if tagSize(addressSize, cacheSize, blockSize, associativity) > 0}
		<td class='t'>{fmtBinary(getTag(address, addressSize, cacheSize, blockSize, associativity), tagSize(addressSize, cacheSize, blockSize, associativity))}</td>
	{/if}
	<MemoryData
		bytes={data}
		highlighted={index => address == null ? false : address + index === selectedAddress}
		colored={index => dataDirty[index]}
		title={index => address == null ? '--' : fmtHex(address + index, addressSize / 4)}
		onClick={index => address == null ? null : selectedAddress = address + index}
	/>
	<td/> <!-- padding -->
</tr>

<style>
	td {
		text-align: center;
	}
</style>
