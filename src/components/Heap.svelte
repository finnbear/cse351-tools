<script context='module'>
	const SIZE_INCREMENT = 128;
	const SIZE_LIMIT = 512;
	const WORD_SIZE = 8;
	const MIN_BLOCK_SIZE = 32;
	const padding = 10;
	const wordWidth = 42;
	const wordHeight = 150;
	const wordPadding = 5;
	const addressFont = 20;
	const freeFont = 15;

	// Returns an array of all blocks in the heap
	export function getBlocks(heapHead) {
		let block = heapHead;
		const blocks = [];
		while (block) {
			blocks.push(block);
			block = block.foll;
		}
		return blocks;
	}

	// Links two blocks
	function setNextAndPrev(from, to) {
		if (from) {
			from.next = to;
		}
		if (to) {
			to.prev = from;
		}
	}

	function boolToBit(bool) {
		return bool ? '1' : '0';
	}

	export const EXPLAIN_ON = 'on';
	export const EXPLAIN_OFF = 'off';
	export const EXPLAIN_OPTIONS = [EXPLAIN_ON, EXPLAIN_OFF];
</script>

<script>
	import {fmtHex} from '../components/Binary.svelte';
	import Container from '../components/Container.svelte';
	import {splitLines} from '../utils/strings.js';

	export let name = 'Heap';
	export let colspan = null;
	export let onFree;

	let size = SIZE_INCREMENT;
	let blockIDCount = 0;
	let history = '';

	// The following was adapted from
	// https://courses.cs.washington.edu/courses/cse351/heapsim/

	const initialBlock = {
		size,
		offset: 0,
		precedingUsed: true,
		used: false
	};
	let freeListHead = initialBlock;
	let heapHead = initialBlock;
	let highlightedBlock = null;

	// Causes the view to update
	function refreshDisplay() {
		// The view code reacts to assignments to this variable
		heapHead = heapHead;
	}

	// Returns first free block in the free list with sufficient size,
	// otherwise null
	function findFreeBlock(requiredSize) {
		let freeBlock = freeListHead;
		while (freeBlock) {
			if (freeBlock.size >= requiredSize) {
				return freeBlock;
			} else {
				freeBlock = freeBlock.next;
			}
		}
		return null;
	}

	// Returns the block matching a given pointer to its data (not header),
	// otherwise null
	function getBlockWithPayloadOffset(payload) {
		let block = heapHead;
		while (block.offset + WORD_SIZE <= payload) {
			if (block.offset + WORD_SIZE === payload) {
				return block;
			}
			block = block.foll;
		}
		return null;
	}

	// Prepends a block to the free list
	function insertFreeBlock(block) {
		setNextAndPrev(block, freeListHead);
		freeListHead = block;

		refreshDisplay();
	}

	// Removes a block from the free list
	function removeFreeBlock(block) {
		if (!block.prev) {
			// First in free list
			freeListHead = block.next;
		}

		setNextAndPrev(block.prev, block.next);

		block.next = null;
		block.prev = null;

		refreshDisplay();
	}

	function coalesceFreeBlock(block) {
		// Coalesce prec
		if (block.prec && !block.precedingUsed) {
			block.prec.size += block.size;
			block.prec.foll = block.foll;

			removeFreeBlock(block);

			// We now have a coalesced block
			block = block.prec;

			// Updates foll's prec.
			if (block.foll) {
				block.foll.prec = block;
			}
		}

		// Coalesce foll
		if (block.foll && !block.foll.used) {
			block.size += block.foll.size;

			removeFreeBlock(block.foll);

			if (block.foll.foll) {
				block.foll.foll.prec = block;
			}

			block.foll = block.foll.foll;
		}

		refreshDisplay();

		return block;
	}

	// Expands the heap (within limits)
	function requestMoreSpace(reqSpace) {
		let lastBlock = heapHead;
		while (lastBlock.foll) {
			lastBlock = lastBlock.foll;
		}

		if (!lastBlock.used) {
			reqSpace -= lastBlock.size;
		}

		reqSpace = Math.ceil(reqSpace / SIZE_INCREMENT) * SIZE_INCREMENT;

		if (reqSpace + size > SIZE_LIMIT) {
			throw new Error('Exceeded max heap size');
		}

		const newBlock = {
			size: reqSpace,
			offset: size,
			used: false,
			precedingUsed: lastBlock.used
		};

		newBlock.prec = lastBlock;
		lastBlock.foll = newBlock;

		insertFreeBlock(newBlock);
		coalesceFreeBlock(newBlock);

		size += newBlock.size;

		refreshDisplay();
	}

	// Uses yield keyboard to return step by step status information without
	// extra context-switching logic
	export function* malloc(requestedSize) {
		// Step 1: Calculate required size
		let requiredSize = (Math.floor(requestedSize / WORD_SIZE) + Math.sign(requestedSize % WORD_SIZE)) * WORD_SIZE;
		requiredSize += WORD_SIZE;
		if (requiredSize < MIN_BLOCK_SIZE) {
			requiredSize = MIN_BLOCK_SIZE;
		}
		yield `Required size: ${requiredSize} bytes`;

		// Step 2. Find free block
		let freeBlock = findFreeBlock(requiredSize);

		if (!freeBlock) {
			requestMoreSpace(requiredSize);
			freeBlock = findFreeBlock(requiredSize);

			if (!freeBlock) {
				throw new Error('Failed to find a free block of required size.');
			}

			yield 'Heap expanded!';
		}

		yield `Free block found at address: ${fmtHex(freeBlock.offset)}`;

		// Step 3. Remove free block from free list
		removeFreeBlock(freeBlock);

		yield 'Block removed from free list.';

		// Step 4. Allocate block

		highlightedBlock = null;

		// Check if big enough to split
		if (freeBlock.size - requiredSize >= MIN_BLOCK_SIZE) {
			// Add new block
			let newBlock = {
				size: freeBlock.size - requiredSize,
				offset: freeBlock.offset + requiredSize,
				used: false,
				precedingUsed: true
			};

			insertFreeBlock(newBlock);
			newBlock = coalesceFreeBlock(newBlock);

			// Resize ourselves
			freeBlock.size = requiredSize;

			// Insert into our heap linked list
			newBlock.foll = freeBlock.foll;
			if (newBlock.foll) {
				newBlock.foll.prec = newBlock;
			}
			freeBlock.foll = newBlock;
			newBlock.prec = freeBlock;
		} else {
			requiredSize = freeBlock.size;
		}

		freeBlock.used = true;
		if (freeBlock.foll) {
			// We're not at the end of the heap
			freeBlock.foll.precedingUsed = true;
		}

		highlightedBlock = freeBlock;
		yield `Block allocated at address: ${fmtHex(freeBlock.offset)}`;

		// Step 5. Return malloc'd block
		highlightedBlock = null;
		const offset = freeBlock.offset + WORD_SIZE;

		yield `Pointer returned: ${fmtHex(offset)}`;

		// Update history
		freeBlock.id = blockIDCount;
		history += `a ${freeBlock.id} ${requestedSize}\n`
		blockIDCount++;

		return offset;
	}

	export function* free(offset) {
		// Step 1. Look through heap for the appropriate block
		let allocBlock = getBlockWithPayloadOffset(offset);

		if (!allocBlock) {
			throw new Error('Could not find block at offset');
		}
		if (!allocBlock.used) {
			throw new Error('Cannot free unused block');
		}

		highlightedBlock = allocBlock;

		yield `Found block with size ${allocBlock.size} at offset ${fmtHex(allocBlock.offset)}.`;

		// Free the block
		allocBlock.used = false;
		if (allocBlock.foll) {
			allocBlock.foll.precedingUsed = false;
		}

		insertFreeBlock(allocBlock);

		yield 'Block freed.';

		highlightedBlock = null;

		// Update history
		history += `f ${allocBlock.id}\n`

		let originalSize = allocBlock.size;
		allocBlock = coalesceFreeBlock(allocBlock);

		yield originalSize < allocBlock.size ? 'Block coalesced.' : 'Block not coalesced.';

		return;
	}

	// Gets a data URI of the operation history in standard format
	export function getHistory() {
		// metadata: unused, num block ids, num ops, unused
		return content = `data:text/plain;charset=utf-8,0\n${blockIDCount}\n${splitLines(history).length}\n0\n${history}`;
	}

	// Returns data representing an SVG arc between two x and y coordinates
	function svgArcD(fromX, fromY, toX, toY) {
		// 3 is arbitrary; larger values mean less deflection
		const dist = Math.hypot(toX - fromX, toY - fromY) * 3;
		return `M${fromX},${fromY}A${dist},${dist} 0 0,1 ${toX},${toY}`;
	}

	// For efficiency, construct the array of blocks once per heapHead change
	$: blocks = getBlocks(heapHead);
</script>

<Container {name} {colspan}>
	<div class=heap>
		<svg width={padding * 2 + (size / WORD_SIZE) * wordWidth} height={padding * 2 + wordHeight + addressFont * 2}>
			<defs>
				<!-- TODO: Multiple color arrow heads without code duplication -->
				<marker
					id='arrow'
					viewBox='0 0 10 10'
					refX={5}
					refY={5}
					markerWidth={3}
					markerHeight={3}
					orient='auto'
					fill='black'
				>
					<path d='M 0 0 L 10 5 L 0 10 z'/>
				</marker>
			</defs>

			<!-- Addresses -->
			{#each Array(size / WORD_SIZE) as _, wordIndex}
				<text class='address' x={wordIndex * wordWidth} y={padding + wordHeight + addressFont + (wordIndex % 2) * addressFont} font-size={`${addressFont}px`} alignment-baseline='middle'>{fmtHex(wordIndex * 8, 4)}</text>
			{/each}

			{#each blocks as block}
				<g on:click={() => onFree && onFree(block.offset + WORD_SIZE)}>
					<!-- Background -->
					<rect class='background' class:allocated={block.used} x={padding + block.offset / WORD_SIZE * wordWidth} y={padding} width={block.size / WORD_SIZE * wordWidth} height={wordHeight}/>

					<!-- Header -->
					<rect class='header word' x={padding + block.offset / WORD_SIZE * wordWidth} y={padding} width={wordWidth} height={wordHeight}/>
					<text class='header' x={padding + wordPadding + block.offset / WORD_SIZE * wordWidth} y={padding + freeFont + wordPadding} font-size={`${freeFont}px`} alignment-baseline='middle'>{block.size}</text>
					<text class='header' x={padding + wordPadding + block.offset / WORD_SIZE * wordWidth} y={padding + (freeFont + wordPadding) * 2} font-size={`${freeFont}px`} alignment-baseline='middle'>{boolToBit(block.used)}</text>
					<text class='header' x={padding + wordPadding + block.offset / WORD_SIZE * wordWidth} y={padding + (freeFont + wordPadding) * 3} font-size={`${freeFont}px`} alignment-baseline='middle'>{boolToBit(block.precedingUsed)}</text>

					{#if block.used}
						{#if onFree}
							<text class='free' x={padding + wordPadding + (block.offset / WORD_SIZE + 1) * wordWidth} y={padding + freeFont + wordPadding} font-size={`${freeFont}px`} alignment-baseline='middle'>Click to Free</text>
						{/if}
					{:else}
						<!-- Prev & Next -->
						{#each Array(2) as _, pointerIndex (pointerIndex)}
							<rect class='pointer word' class:allocated={block.used} x={padding + (block.offset / WORD_SIZE + 1 + pointerIndex) * wordWidth} y={padding} width={wordWidth} height={wordHeight}/>
						{/each}

						<!-- Footer -->
						<rect class='footer word' class:allocated={block.used} x={padding + ((block.offset + block.size) / WORD_SIZE - 1) * wordWidth} y={padding} width={wordWidth} height={wordHeight}/>
					{/if}

					<!-- Border -->
					<rect class='border' x={padding + block.offset / WORD_SIZE * wordWidth} y={padding} width={block.size / WORD_SIZE * wordWidth} height={wordHeight}/>
				</g>
			{/each}

			<!-- Highlighted Block -->
			{#if highlightedBlock}
				<rect class='highlight' x={padding + highlightedBlock.offset / WORD_SIZE * wordWidth} y={padding} width={highlightedBlock.size / WORD_SIZE * wordWidth} height={wordHeight}/>
			{/if}

			<!-- Free List Head Arrow -->
			{#if freeListHead}
				<path
					class='arrow'
					d={svgArcD(0, padding, padding + (freeListHead.offset / WORD_SIZE + 0.5) * wordWidth, padding * 2)}
					fill='transparent'
					stroke={'blue'}
					marker-end='url(#arrow)'
				/>
			{/if}

			<!-- Prev & Next Arrows -->
			{#each blocks as block}
				{#if !block.used}
					{#each Array(2) as _, pointerIndex (pointerIndex)}
						{#if pointerIndex == 0 ? block.prev : block.next}
							<path
								class='arrow'
								d={svgArcD(padding + (block.offset / WORD_SIZE + 1.5 + pointerIndex) * wordWidth, padding + (pointerIndex ? padding : wordHeight - padding), padding + ((pointerIndex == 0 ? block.prev : block.next).offset / WORD_SIZE + 0.5) * wordWidth, padding + (pointerIndex ? padding : wordHeight - padding))}
								fill='transparent'
								stroke={pointerIndex ? 'red' : 'blue'}
								marker-end='url(#arrow)'
							/>
						{/if}
					{/each}
				{/if}
			{/each}
		</svg>
	</div>
	<p>Blocks have a pink header, describing their size, whether they are used,
	and whether the previous block is used. Unused blocks also have a blue
	previous and next pointer, and an orange footer.</p>
</Container>

<style>
	div.heap {
		overflow-x: auto;
	}

	p {
		margin-bottom: 0;
	}

	rect.background {
		fill: #333333;
	}

	rect.background.allocated {
		cursor: pointer;
		fill: #3498db;
	}

	rect.background.allocated:hover {
		filter: brightness(1.1);
	}

	rect.border {
		fill: none;
		stroke: #111111;
		stroke-width: 4px;
	}

	rect.highlight {
		fill: none;
		stroke: yellow;
		stroke-width: 4px;
	}

	rect.word {
		stroke: #111111;
		stroke-width: 2px;
	}

	rect.header {
		fill: #ff66cc;
	}

	rect.pointer {
		fill: #6EA5D0;
	}

	rect.footer {
		fill: #FF751A;
	}

	path.arrow {
		pointer-events: none;
		stroke-width: 3px;
	}

	text {
		fill: var(--text-color);
	}

	text.header {
		fill: var(--text-contrast-color);
	}

	text.address {
		fill: var(--text-secondary-color);
	}
</style>
