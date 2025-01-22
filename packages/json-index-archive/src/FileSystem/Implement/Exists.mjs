import { ROOT } from '../Abstract.mjs';
import * as Pathname from '../Pathname.mjs';

/** @param {import('../Constructor.mjs').FileSystem} self */
export default (self, pathname) => {
	return self[ROOT].find(...Pathname.parse(pathname)) === null ? false : true;
};
