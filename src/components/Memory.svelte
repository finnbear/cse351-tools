<script context='module'>
	import {fmtHex} from './Binary.svelte';
	import {maxUnsigned} from '../scripts/math.js';

	export const wordSize = 8; // bytes

	function randomByte() {
		// TODO: Use seeded random (not that the memory contents matter)
		return Math.floor(Math.random() * 255);
	}

	function randomData(addressSize) {
		const data = [];
		for (let i = 0; i < maxUnsigned(addressSize) / wordSize; i++) {
			const word = [];
			for (let b = 0; b < wordSize; b++) {
				word.push(randomByte());
			}
			data.push(word);
		}
		return data;
	}
</script>

<script>
	import Container from './Container.svelte';
	import MemoryData from './MemoryData.svelte';
	import {log2} from '../scripts/math.js';

	export let name = 'Memory';
	export let colspan = null;
	export let address = null;
	export let addressSize = 8;
	export let data;

	export function read(address) {
		return data[address >> log2(wordSize)][address % wordSize];
	}

	export function write(address, byte) {
		data[address >> log2(wordSize)][address % wordSize] = byte;
	}

	$: {
		if (address != null) {
			// Make sure the address stays valid
			address = Math.min(address, maxUnsigned(addressSize));
		}
	}

	// Refill memory with random data whenever addressSize changes
	$: data = randomData(addressSize);
</script>

<Container {name} {colspan}>
	<div>
		<table>
			<thead>
				<tr>
					<th>Address</th>
					<th colspan={8}>Data</th>
				</tr>
			</thead>
			<tbody>
				{#each data as word, wordIndex}
					<tr>
						<td class='address'>{fmtHex(wordIndex * 8, addressSize / 4)}</td>
						<MemoryData
							bytes={word}
							highlighted={byteIndex => wordIndex * 8 + byteIndex === address}
							onClick={byteIndex => address = wordIndex * 8 + byteIndex}
							title={byteIndex => fmtHex(wordIndex * 8 + byteIndex, addressSize / 4)}
						/>
						<td/> <!-- padding -->
					</tr>
					<tr class=spacer/>
				{/each}
			</tbody>
		</table>
	</div>
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

	tr:hover > td.address {
		font-weight: bold;
	}

	tr.spacer {
		height: 5px;
	}

	td {
		padding: 5px;
		text-align: center;
	}

	td.address {
		color: var(--text-color);
	}
</style>
