<script>
	export let path;
	export let selected;
</script>

<!-- process.env.BASE_PATH will be templated in at bundle-time -->
<a class:selected href={`${process.env.BASE_PATH}/${path}`}>
	<slot/>
</a>

<style>
	a {
		color: var(--text-secondary-color);
		background-color: inherit;
		border-bottom: 2px solid #222222;
		color: var(--text-secondary-color);
		float: left;
		font-size: 1.25em;
		border: none;
		box-shadow: none;
		outline: none;
		cursor: pointer;
		padding: 7px 8px;
		text-decoration: none;
		transition: color 0.5s;
		user-select: none;
	}

	a.selected {
		border-bottom: 2px solid #3498db;
		cursor: default;
		color: var(--text-color);
	}
</style>
