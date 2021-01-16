<script>
	import NavLink from './NavLink.svelte';

	export let currentPath;
	export let pages;
</script>

<svelte:head>
	<title>{pages[currentPath] || 'CSE 351 Tools'}</title>
</svelte:head>

<div>
	{#each Object.entries(pages) as [path, title]}
		<NavLink {path} selected={path === currentPath}>{title}</NavLink>
	{/each}
</div>

<style>
	div {
		background-color: var(--text-contrast-color);
		display: flex;
		background-color: inherit;
		justify-content: space-around;
		overflow: hidden;
		width: 100%;
	}
</style>
