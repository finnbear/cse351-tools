<script>
	import Button from '../components/Button.svelte';
	import Container from '../components/Container.svelte';
	import Heap, {EXPLAIN_OPTIONS, EXPLAIN_ON, EXPLAIN_OFF} from '../components/Heap.svelte';
	import Integer from '../components/Integer.svelte';
	import Select from '../components/Select.svelte';
	import {BigInteger} from 'bigdecimal';

	// Parameters
	let explain = EXPLAIN_OFF;
	let mallocSizeBigInt = new BigInteger('4');

	// mallocSize is more useful as a normal number, so maintain such a copy
	$: mallocSize = parseInt(mallocSizeBigInt.toString());

	// Status message
	let status = '';

	// Compnent ref
	let heap;

	// Malloc and free transactions (useful for determining if there is an
	// operation currently being performed)
	let mallocTx;
	let freeTx;

	// If pushHistory is passed in, the operation is treated as a user initiated
	// action, worthy of changing the explanation if applicable. Otherwise,
	// it is treated as a replay history action, and no additional history or
	// status updates will be generated.
	//
	// heap.malloc is a generator function that returns what essentially amounts
	// to an iterator.
	function doMalloc(pushHistory, mallocSize) {
		if (freeTx) {
			return;
		}
		let offset = null;

		if (!mallocTx) {
			mallocTx = heap.malloc(mallocSize, pushHistory);
			if (!mallocTx) {
				return;
			}
		}
		do {
			try {
				const next = mallocTx.next();

				if (next.done) {
					offset = next.value;
					mallocTx = null;
					status = 'Finished malloc operation';
					break;
				} else if (explain === EXPLAIN_ON && pushHistory) {
					status = next.value;
				}
			} catch (err) {
				mallocTx = null;
				status = err;
				break;
			}
		} while (explain === EXPLAIN_OFF || !pushHistory);

		return offset;
	}

	function doFree(pushHistory, offset) {
		if (mallocTx) {
			return;
		}
		if (!freeTx) {
			freeTx = heap.free(offset, pushHistory);
			if (!freeTx) {
				return;
			}
		}
		do {
			try {
				const next = freeTx.next();

				if (next.done) {
					freeTx = null;
					status = 'Finished free operation';
					break;
				} else if (explain === EXPLAIN_ON && pushHistory) {
					status = next.value;
				}
			} catch (err) {
				freeTx = null;
				status = err;
				break;
			}
		} while (explain === EXPLAIN_OFF || !pushHistory);
	}

	// History, as an array of lines
	const history = [];
	let historyIndex = 0;

	// Pushes a line to history, invalidating the redo buffer
	// if it exists
	function pushHistory(line) {
		if (history.length > historyIndex) {
			// invalidate redo buffer
			history.length = historyIndex;
		}
		history.push(line);
		historyIndex++;
	}

	// Resets the heap and replays historical operations up until the current
	// historyIndex
	function replayHistory() {
		heap.reset();

		// This is the only segment of code that actually keeps track
		// of block IDs as opposed to block offsets, using this map
		// of blockID to offset.
		const offsets = {};

		for (let i = 0; i < historyIndex; i++) {
			const line = history[i];
			const segments = line.split(' ');
			const blockID = parseInt(segments[1]);
			if (isNaN(blockID)) {
				throw new Error('mallformed blockID in history');
			}
			switch (segments[0]) {
				case 'a':
					mallocSize = parseInt(segments[2]);
					if (isNaN(mallocSize)) {
						throw new Error('mallformed mallocSize in history');
					}
					const offset = doMalloc(null, mallocSize);
					offsets[blockID] = offset;
					break;
				case 'f':
					if (!(blockID in offsets)) {
						throw new Error('unrecognized blockID in history');
					}
					doFree(null, offsets[blockID])
					break;
			}
		}
	}

	// Undo and redo work by replaying the entire history, plus or minus a
	// single operation, which works since heap operations are deterministic
	function undo() {
		if (historyIndex == 0) {
			return; // nothing to undo
		}
		historyIndex--;
		replayHistory();
	}

	function redo() {
		if (historyIndex == history.length) {
			return; // nothing to redo
		}
		historyIndex++;
		replayHistory();
	}

	// Gets a data URI of the operation history in standard format
	export function fmtHistory() {
		let lines = '';

		for (let i = 0; i < historyIndex; i++) {
			lines += history[i] + '\n';
		}

		// metadata: unused, num block ids, num ops, unused
		return content = `data:text/plain;charset=utf-8,0\n${heap.getBlockIDCount()}\n${historyIndex}\n0\n${lines}`;
	}

	// Automatically initiates the process of saving a history file
	function doExport() {
		const link = document.createElement('a');
		link.download = 'heap.rep';
		link.href = encodeURI(fmtHistory());
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<table>
	<tr>
		<Heap colspan={4} onFree={mallocTx ? null : doFree.bind(null, pushHistory)} bind:this={heap}/>
	</tr>
	<tr>
		<Integer name='Malloc Size' description='The size, in bytes, to allocate' disabled={mallocTx} bind:value={mallocSizeBigInt}/>
		<Button name='Malloc' description='Allocates a new block' disabled={!mallocSize || freeTx} on:click={() => doMalloc(pushHistory, mallocSize)}>{mallocTx ? 'Next...' : 'Malloc'}</Button>
		<Select name='Explain' description='Allocates and frees step by step' options={EXPLAIN_OPTIONS} bind:value={explain}/>
		<Button name='Undo' description='Reverses the last operation' disabled={historyIndex === 0 || mallocTx || freeTx} on:click={undo}>Undo</Button>
	</tr>
	<tr>
		<Container colspan={2} name='Status'>{status || 'Nothing has happened yet'}</Container>
		<Button name='Export History' description='Downloads history of operations' disabled={!status} on:click={doExport}/>
		<Button name='Redo' description='Like undo but for undo' disabled={historyIndex === history.length || mallocTx || freeTx} on:click={redo}>Redo</Button>
	</tr>
</table>
