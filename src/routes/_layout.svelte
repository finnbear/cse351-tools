<script>
	import Nav from '../components/Nav.svelte';
	import {slide} from 'svelte/transition';

	export let segment;

	// Map of path (must match src/routes filenames) to title
	const pages = {
		'integer': 'Integer Sim',
		'float': 'Floating Point Sim',
		'matrix': 'Matrix Viz',
		'cache': 'Cache Sim',
		'heap': 'Heap Sim',
	};
</script>

<main>
	<h1>CSE 351 Tools</h1>
	<Nav {pages} currentPath={segment}/>
	{#key segment} <!-- Recreates contents when path updates, to play transition -->
		<div transition:slide>
			<slot/>
		</div>
	{/key}
</main>

<style>
	h1 {
		text-align: center;
	}

	main {
		margin: auto;
		max-width: 900px;
		padding: 10px;
		position: relative;
	}

	:global(main > div > table) {
		border-spacing: 8px;
		table-layout: fixed;
		width: 100%;
	}
</style>
