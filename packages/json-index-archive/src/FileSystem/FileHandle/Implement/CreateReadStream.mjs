import { ReadStream } from '../../ReadStream.mjs';

/** @param {import('../Constructor.mjs').FileHandle} self */
export default (self, ...options) => {
	return new ReadStream({ fetchFileHandle: () => self }, ...options);
};
