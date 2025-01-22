import * as fs from 'node:fs';

import * as Ow from '@produck/ow';

import { ROOT, PATHNAME } from '../Abstract.mjs';
import * as Pathname from '../Pathname.mjs';
import * as JIARError from '../Error.mjs';
import { FileHandle } from '../FileHandler.mjs';

/** @param {import('../Constructor.mjs').FileSystem} self */
export default async (self, pathname) => {
	const node = self[ROOT].find(...Pathname.parse(pathname));

	if (node === null) {
		Ow.throw(JIARError.ENOENT(pathname));
	}

	const handle = await fs.promises.open(self[PATHNAME], 'r');

	return new FileHandle(handle, node.offset, node.size);
};
