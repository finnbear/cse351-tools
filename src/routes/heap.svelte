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

	// Button actions
	let mallocTx;
	function doMalloc() {
		if (!mallocTx) {
			mallocTx = heap.malloc(mallocSize);
			if (!mallocTx) {
				return;
			}
		}
		do {
			try {
				const next = mallocTx.next();

				if (next.done) {
					console.log(next.value);
					mallocTx = null;
					status = 'Finished malloc operation';
					break;
				} else if (explain === EXPLAIN_ON) {
					status = next.value;
				}
			} catch (err) {
				mallocTx = null;
				status = err;
				break;
			}
		} while (explain === EXPLAIN_OFF);
	}

	let freeTx;
	function doFree(offset) {
		if (!freeTx) {
			freeTx = heap.free(offset);
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
				} else if (explain === EXPLAIN_ON) {
					status = next.value;
				}
			} catch (err) {
				freeTx = null;
				status = err;
				break;
			}
		} while (explain === EXPLAIN_OFF);
	}

	// Automatically initiates the process of saving a history file
	function doExport() {
		const link = document.createElement('a');
		link.download = 'heap.rep';
		link.href = encodeURI(heap.getHistory());
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<table>
	<tr>
		<Heap colspan={3} onFree={doFree} bind:this={heap}/>
	</tr>
	<tr>
		<Integer name='Malloc Size' description='The size, in bytes, to allocate' disabled={mallocTx} bind:value={mallocSizeBigInt}/>
		<Button name='Malloc' description='Allocates a new block' disabled={!mallocSize} on:click={doMalloc}>{mallocTx ? 'Next...' : 'Malloc'}</Button>
		<Select name='Explain' description='Allocates and frees step by step' options={EXPLAIN_OPTIONS} bind:value={explain}/>
	</tr>
	<tr>
		<Container colspan={2} name='Status'>{status || 'Nothing has happened yet'}</Container>
		<Button name='Export History' description='Downloads history of operations' disabled={!status} on:click={doExport}/>
	</tr>
</table>
