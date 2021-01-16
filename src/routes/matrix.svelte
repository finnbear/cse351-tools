<script>
	import {fmtHex} from '../components/Binary.svelte';
	import Container from '../components/Container.svelte';
	import Slider from '../components/Slider.svelte';
	import Integer from '../components/Integer.svelte';
	import Select from '../components/Select.svelte';
	import big from 'bigdecimal';

	let rowCount = 4;
	let columnCount = 4;
	let dataSize = 1;
	let startAddress = new big.BigInteger('0');
	let ordering = 'Row-major';

	$: rows = Array(rowCount);
	$: columns = Array(columnCount);

	let hovered = null;

	function computeAddress(row, column, rowCount, columnCount, ordering, dataSize, startAddress) {
		let offset;

		if (ordering === 'Column-major') {
			offset = column * rowCount + row;
		} else {
			offset = row * columnCount + column;
		}

		return startAddress.add(new big.BigInteger(`${offset * dataSize}`));
	}
</script>

<table>
	<tr>
		<Slider colspan={3} name='Rows' min={1} max={32} bind:value={rowCount}/>
	</tr>
	<tr>
		<Slider colspan={3} name='Columns' min={1} max={32} bind:value={columnCount}/>
	</tr>
	<tr>
		<Integer name='Start Address' description='The address of the first (top left) cell' bind:value={startAddress}/>
		<Select name='Ordering' description='How the matrix is organized in memory' bind:value={ordering} options={['Row-major', 'Column-major']}/>
		<Slider name='Data Bytes' description='Number of bytes taken by each cell' min={1} max={8} bind:value={dataSize}/>
	</tr>
	<tr>
		<Container colspan={3} name='Matrix'>
			<div class=grid style={`grid-template-columns: repeat(${columnCount}, 1fr);`}>
				{#each rows as _, row}
					{#each columns as _, column}
						<div
							class=cell
							class:line={hovered && (hovered.row == row || hovered.column == column)}
							title={`${column}, ${row} = ${fmtHex(computeAddress(row, column, rowCount, columnCount, ordering, dataSize, startAddress))}`}
							on:mouseenter={() => hovered = {row, column}}
							on:mouseleave={() => hovered = null}
						>
							{fmtHex(computeAddress(row, column, rowCount, columnCount, ordering, dataSize, startAddress))}
						</div>
					{/each}
				{/each}
			</div>
			{#if hovered}
				<p>Column {hovered.column}, Row {hovered.row}</p>
				<p>Address: {fmtHex(computeAddress(hovered.row, hovered.column, rowCount, columnCount, ordering, dataSize, startAddress))}</p>
			{:else}
				<p>Column ?, Row ?</p>
				<p>Address: ?</p>
			{/if}
		</Container>
	</tr>
</table>

<style>
	div.grid {
		display: grid;
		grid-gap: 5px 5px;
	}

	div.cell {
		color: var(--text-color);
		background-color: gray;
		border-radius: 5px;
		font-size: 0.9em;
		font-weight: bold;
		height: 20px;
		overflow: hidden;
		text-align: center;
		text-overflow: ellipsis;
		transition: filter 0.25s;
		white-space: nowrap;
		width: 100%;
	}

	div.cell.line {
		filter: brightness(1.2);
	}

	div.cell:hover, div.cell.line:hover {
		filter: brightness(1.4);
	}

	p {
		margin-bottom: 0;
		margin-top: 5px;
	}
</style>
