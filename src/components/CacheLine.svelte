<script context='module'>
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

	function setDirty(offset, newValue) {
		dataDirty[offset] = newValue;
		dataDirty = dataDirty; // trigger Svelte update
	}

	function allNonNull(arr) {
		return arr.every(item => item != null);
	}

	export function isValid() {
		return allNonNull(data);
	}

	function anyTrue(arr) {
		return arr.some(val => val);
	}

	export function isDirty() {
		return anyTrue(dataDirty) && isValid();
	}

	export function getLineTag() {
		return getTag(address, addressSize, cacheSize, blockSize, associativity);
	}

	export function read(offset) {
		return data[offset];
	}

	export function write(offset, byte, makeDirty = true) {
		data[offset] = byte;
		if (makeDirty) {
			setDirty(offset, true);
		}
	}

	function align(address) {
		return Math.floor(address / blockSize) * blockSize;
	}

	export function load(memory, addr) {
		address = align(addr);
		for (let offset = 0; offset < blockSize; offset++) {
			write(offset, memory.read(address + offset), false);
			setDirty(offset, false);
		}
	}

	export function flush(memory) {
		if (address == null || !isValid()) {
			return;
		}
		for (let offset = 0; offset < blockSize; offset++) {
			memory.write(address + offset, read(offset));
			setDirty(offset, false);
		}
	}

	export function clear() {
		address = null;
		data = arrayOf(blockSize, null);
		dataDirty = arrayOf(blockSize, false);
	}

	$: clear(blockSize); // trigger clear on blockSize change
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
