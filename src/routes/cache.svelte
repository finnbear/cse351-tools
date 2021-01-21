<script>
	import {fmtBinary, fmtHex} from '../components/Binary.svelte';
	import Button from '../components/Button.svelte';
	import Cache, {getOffset, offsetSize, getIndex, indexSize, getTag, tagSize, WRITE_HIT_BACK, WRITE_HIT_THROUGH, WRITE_HIT_OPTIONS, WRITE_MISS_ALLOCATE, WRITE_MISS_NO_ALLOCATE, WRITE_MISS_OPTIONS, REPLACEMENT_LRU, REPLACEMENT_RANDOM, REPLACEMENT_FIFO, REPLACEMENT_OPTIONS, EXPLAIN_ON, EXPLAIN_OFF, EXPLAIN_OPTIONS} from '../components/Cache.svelte';
	import Container from '../components/Container.svelte';
	import Integer from '../components/Integer.svelte';
	import Logger from '../components/Logger.svelte';
	import Memory from '../components/Memory.svelte';
	import OptionsSlider from '../components/OptionsSlider.svelte';
	import Select from '../components/Select.svelte';
	import Slider from '../components/Slider.svelte';
	import {log2} from '../utils/math.js';
	import {splitLines, plural} from '../utils/strings.js';
	import {BigInteger} from 'bigdecimal';

	const HISTORY_CURSOR = '>';

	// Parameter
	let address;
	let value = new BigInteger('255');
	let addressSize = 8;
	let cacheSize = 64;
	let blockSize = 8;
	let associativity = 1;
	let writeHit = WRITE_HIT_BACK;
	let writeMiss = WRITE_MISS_ALLOCATE;
	let replacement = REPLACEMENT_LRU;
	let explain = EXPLAIN_OFF;

	// Returns a percentage with two decimal places and a percent sign
	function fmtPercent(value, total) {
		const percent = total > 0 ? value * 100 / total : 0;
		return `${percent.toFixed(2)}%`;
	}

	// Refs to instances of the respective components, values, and functions
	let memory;
	let cache;
	let hits = 0;
	let misses = 0;
	let log;
	let logContents;

	// Button actions
	let readTx;
	function doRead(history) {
		if (!readTx) {
			readTx = cache.read(memory, address, history ? () => {} : log);
			if (!readTx) {
				return;
			}
		}
		do {
			const next = readTx.next();

			if (next.done) {
				value = new BigInteger(`${next.value}`);
				readTx = null;
				if (!history && explain === EXPLAIN_ON) {
					log('Finished read operation');
				}
				break;
			} else if (!history && explain === EXPLAIN_ON) {
				log(next.value);
			}
		} while (history || explain === EXPLAIN_OFF);
	}

	let writeTx;
	function doWrite(history) {
		if (!writeTx) {
			writeTx = cache.write(memory, address, parseInt(value.toString()) & 255, history ? () => {} : log);
			if (!writeTx) {
				return;
			}
		}
		do {
			const next = writeTx.next();

			if (next.done) {
				writeTx = null;
				if (!history && explain === EXPLAIN_ON) {
					log('Finished write operation');
				}
				break;
			} else if (!history && explain === EXPLAIN_ON) {
				log(next.value);
			}
		} while (history || explain === EXPLAIN_OFF);
	}

	function doFlush(history) {
		cache.flush(memory, history ? () => {} : log);
	}

	// Returns the position in history of the last executed line (defaults to
	// the most recent line)
	function getHistoryPosition(logLines) {
		let index = logLines.findIndex(line => line.startsWith(HISTORY_CURSOR));
		if (index == -1) {
			return logLines.length - 1;
		}
		return index;
	}

	// Removes the history cursor
	// Calling this function is problematic, since it will conflict with changes
	// to logContents made inside Logger.svelte
	// TODO: Figure out a way to safely call this function
	function clearHistoryPosition() {
		let needsReset = false;
		let lines = splitLines(logContents);
		lines = lines.map(line => {
			if (line.startsWith(HISTORY_CURSOR)) {
				line = line.substring(1);
				needsReset = true;
			}
			return line;
		});
		logContents = lines.join('\n') + '\n';
		if (needsReset) {
			console.log('cache sim - auto-resetting from history');
			doReset();
		}
	}

	// Changes the position in history by an offset (1 i.e. forward or -1 i.e.
	// backward)
	function changeHistoryPosition(increment) {
		let lines = splitLines(logContents);
		let position = getHistoryPosition(lines) + increment;
		if (position < 0 || position >= lines.length) {
			return;
		}
		lines = lines.map((line, i) => {
			if (line.startsWith(HISTORY_CURSOR)) {
				line = line.substring(1);
			}
			if (i == position && i < lines.length - 1) {
				line = HISTORY_CURSOR + line;
			}
			return line;
		})
		logContents = lines.join('\n') + '\n';
	}

	function doBackward() {
		changeHistoryPosition(-1);
		doReset();
	}

	function doForward() {
		changeHistoryPosition(1);
		doReset();
	}

	// TODO: Take a parameter of whether to reset random seed
	function doReset() {
		cache.reset();

		const lines = splitLines(logContents);
		let done = false;

		for (let line of lines) {
			if (done) {
				break;
			}
			done = line.startsWith(HISTORY_CURSOR);

			const parseR = line.match(/R\( *0x([0-9a-f]+) *\)/i);
			const parseW = line.match(/W\( *0x([0-9a-f]+) *, *0x([0-9a-f]+) *\)/i);
			const parseF = line.match(/cache flushed/i);
			if (parseR == null && parseW == null && parseF == null) {
				continue;
			}
			if (parseF) {
				doFlush(true);
				continue;
			}
			const parse = (parseW != null ? parseW : parseR);
			address = parseInt(parse[1], 16);
			if (parseW) {
				value = new BigInteger(parse[2], 16);
			}

			if (parseW) {
				doWrite(true);
			} else {
				doRead(true);
			}
		}
	}

	// Invalidate transactions when settings are changed
	$: {
		const key = addressSize + cacheSize + associativity + blockSize;
		readTx = null;
		writeTx = null;
	}
</script>

<table>
	<tr>
		<OptionsSlider name='Address Size' description='Address size, in bits' options={[4, 8, 12]} bind:value={addressSize} slider={false}/>
		<OptionsSlider name='Cache Size' description='Cache size, in bytes' options={[8, 16, 32, 64, 128, 256]} bind:value={cacheSize} slider={false}/>
		<OptionsSlider name='Associativity' description={plural('Way', associativity)} options={[1, 2, 4]} bind:value={associativity} slider={false}/>
		<OptionsSlider name='Block Size' description='Block size, in bytes' options={[2, 4, 8]} bind:value={blockSize} slider={false}/>
	</tr>
	<tr>
		<Select name='Write Hit' options={WRITE_HIT_OPTIONS} bind:value={writeHit}/>
		<Select name='Write Miss' options={WRITE_MISS_OPTIONS} bind:value={writeMiss}/>
		<Select name='Replacement' options={REPLACEMENT_OPTIONS} disabled={associativity < 2} bind:value={replacement}/>
		<Select name='Explain' options={EXPLAIN_OPTIONS} bind:value={explain}/>
	</tr>
	<tr>
		<Memory colspan={2} name={'Physical Memory'} bind:address {addressSize} bind:this={memory}/>
		<Cache colspan={2} bind:selectedAddress={address} bind:hits bind:misses {addressSize} {cacheSize} {blockSize} {associativity} {writeHit} {writeMiss} {replacement} {explain} bind:this={cache}/>
	</tr>
	<tr>
		<Container name='Address' description='Click a memory cell'>
			<b>{fmtHex(address, addressSize / 4)}</b>
		</Container>
		<Container name='Tag' description={`First ${tagSize(addressSize, cacheSize, blockSize, associativity)} bit(s) of address`}>{tagSize(addressSize, cacheSize, blockSize, associativity) > 0 ? fmtBinary(getTag(address, addressSize, cacheSize, blockSize, associativity), tagSize(addressSize, cacheSize, blockSize, associativity)) : "N/A"}</Container>
		<Container name='Index' description={`Middle ${indexSize(cacheSize, blockSize, associativity)} bit(s) of address`}>{fmtBinary(getIndex(address, cacheSize, blockSize, associativity), indexSize(cacheSize, blockSize, associativity))}</Container>
		<Container name='Offset' description={`Last ${offsetSize(blockSize)} bit(s) of address`}>{fmtBinary(getOffset(address, blockSize), offsetSize(blockSize))}</Container>
	</tr>
	<tr>
		<Button name='Read' disabled={address == null} on:click={() => doRead()}>{readTx ? 'Next...' : 'Read value at address'}</Button>
		<Integer name='Value' bind:value/>
		<Button name='Write' disabled={address == null} on:click={() => doWrite()}>{writeTx ? 'Next...' : 'Write value to address'}</Button>
		<Button name='Flush' on:click={() => doFlush()}>Flush cache to memory</Button>
	</tr>
	<tr>
		<Logger colspan={2} rowspan={2} name='History' bind:log bind:value={logContents}/>
			<Button name='Go Back' on:click={doBackward}>{'Go one step backward in history'}</Button>
		<Container name='Statistics'>
			<p>{hits} {plural('Hit', hits)}, {misses} {plural('Miss', misses)}</p>
			<p>{fmtPercent(hits, hits + misses)} Hit</p>
		</Container>
	</tr>
	<tr>
		<Button name='Go Forward' on:click={doForward}>{'Go one step forward in history'}</Button>
		<Button name='Reset from History' on:click={() => doReset()}>{'Reset cache and perform all operations listed in history'}</Button>
	</tr>
</table>

<style>
	p {
		line-height: 0.5;
		text-align: center;
	}
</style>
