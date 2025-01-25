import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

import { AbstractNode } from './AbstractNode.mjs';

const SIZE = Symbol('size');
const OFFSET = Symbol('offset');

export class FileNode extends AbstractNode {
	[OFFSET] = 0;
	[SIZE] = 0;

	constructor(offset, size, ...extension) {
		Assert.Integer(offset, 'offset');
		Assert.Integer(size, 'size');

		if (offset < 0) {
			Ow.Error.Range('Offset MUST be > 0.');
		}

		if (size < 0) {
			Ow.Error.Range('Size MUST be > 0.');
		}

		super(...extension);
		this[OFFSET] = offset;
		this[SIZE] = size;
	}

	get offset() {
		return this[OFFSET];
	}

	get size() {
		return this[SIZE];
	}
}
