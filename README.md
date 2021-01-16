# CSE 351 Tools

## About

- Hosted [here](https://students.washington.edu/finnb/cse351sim/) for now (there is an issue with UW webserver returning `429 - Too Many Requests`, but it should work once everything is cached)
- Developed in the [Svelte](https://svelte.dev/) language, using the [Sapper](https://sapper.svelte.dev/) framework (soon to be built into Svelte)
- Designed to replace the 4 existing simulators and add at least 1 new simulator (Integer Sim)
- Developed with compatibility in mind (such as the format of Heap Sim history export)

## Installation

1. Run `npm install`

## Development

1. Run `npm run dev`
2. Navigate to the `localhost` url given, and add the base path
3. Page will refresh to reflect saved changes to `.svelte` files

## Export

1. Run `./zip.sh`
2. Copy `__sapper__/export/[basepath].zip` to server
3. Unzip and ensure basepath matches
4. Use a regular HTTP server, the site is static

## Base Path

Currently, the base path is set to `/finnb/cse351sim` as the first deployment
was to [here](https://students.washington.edu/finnb/cse351sim/)

To change the base path, edit the export command in `package.json` (make sure that the value of the basepath argument is the last token in the script)
