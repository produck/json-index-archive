import * as Ow from '@produck/ow';
import { Assert } from '@produck/idiom';

import { AbstractNode } from './AbstractNode.mjs';

export const MEMBER = {
	SIZE: Symbol('size'),
	OFFSET: Symbol('offset'),
};

export class FileNode extends AbstractNode {
	[MEMBER.OFFSET] = 0;
	[MEMBER.SIZE] = 0;

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
		this[MEMBER.OFFSET] = offset;
		this[MEMBER.SIZE] = size;
	}

	get offset() {
		return this[MEMBER.OFFSET];
	}

	get size() {
		return this[MEMBER.SIZE];
	}
}
