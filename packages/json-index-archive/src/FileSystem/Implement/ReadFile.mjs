export default (self, pathname, ...options) => {
	options = normalizeReadFileOptions(options);

	const handle = await this.open(pathname);

	return await handle.readFile(options);
};
