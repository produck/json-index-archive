import * as Ow from '@produck/ow';
import { Is } from '@produck/idiom';

import { ROOT } from '../Abstract.mjs';
import * as Pathname from '../Pathname.mjs';
import { ENOENT } from '../Error.mjs';
import { Stats } from '../Stats.mjs';

/** @param {import('../Constructor.mjs').FileSystem} self */
export default (self, pathname) => {
	const node = self[ROOT].find(...Pathname.parse(pathname));

	if (Is.Null(node)) {
		Ow.throw(ENOENT(pathname, 'stat'));
	}

	return new Stats(node);
};
