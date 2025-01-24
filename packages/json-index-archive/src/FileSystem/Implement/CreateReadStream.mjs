import { ReadStream } from '../ReadStream.mjs';

/** @param {import('../Constructor.mjs').FileSystem} self */
export default (self, pathname, ...options) => {
	return new ReadStream({
		path: pathname,
		fetchFileHandle: async () => await self.open(pathname),
	}, ...options);
};
