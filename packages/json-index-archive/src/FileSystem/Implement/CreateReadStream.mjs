export default (self, pathname, ...options) => {
	Pathname.assert(pathname);
	options = normalizeReadStreamOptions(options);

	const stream = Stream.Readable.from(async () => {
		const handle = await this.open(pathname);
		const readStream = handle.createReadStream(options);

		for await (const chunk of readStream) {
			// yield chunk;
		}
	});

	return stream;
};
