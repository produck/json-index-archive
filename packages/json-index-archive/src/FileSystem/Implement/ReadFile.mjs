/** @param {import('../Constructor.mjs').FileSystem} self */
export default async (self, pathname, ...options) => {
	const handle = await self.open(pathname);

	return await handle.readFile(...options);
};
