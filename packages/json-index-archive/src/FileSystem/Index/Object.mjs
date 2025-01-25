import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';
import * as Tree from './Tree.mjs';

export const TYPE = { FILE: 0, DIRECTORY: 1 };

export const NODE = {
	TYPE: 0, NAME: 1,
	DIRECTORY: { CHILDREN: 2, EXTEND: 3 },
	FILE: { OFFSET: 2, SIZE: 3, EXTEND: 4 },
};

export function* build(object, node) {
	Assert.Type.Object(object, 'object');

	if (!Tree.isNode(node)) {
		Ow.Invalid('node', 'FileNode | DirectoryNode');
	}

	const children = object[NODE.DIRECTORY.CHILDREN];

	Assert.Array(children, `[${NODE.DIRECTORY.CHILDREN}]`);

	for (const childTuple of children) {
		const type = childTuple[NODE.TYPE];
		const name = childTuple[NODE.NAME];

		Assert.Type.String(name, `[${NODE.NAME}]`);

		if (type === TYPE.FILE) {
			const offset = childTuple[NODE.FILE.OFFSET];
			const size = childTuple[NODE.FILE.SIZE];

			Assert.Type.String(offset, `[${NODE.FILE.OFFSET}]`);
			Assert.Type.String(size, `[${NODE.FILE.SIZE}]`);

			const offsetNumber = Number(offset);

			if (Is.NaN(offsetNumber)) {
				Ow.Error.Common(`"${NODE.FILE.OFFSET}" SHOULD NOT be NaN.`);
			}

			const sizeNumber = Number(size);

			if (Is.NaN(sizeNumber)) {
				Ow.Error.Common(`"${NODE.FILE.SIZE}" SHOULD NOT be NaN.`);
			}

			const extension = childTuple[NODE.FILE.EXTEND];
			const childNode = new Tree.FileNode(offsetNumber, sizeNumber, extension);

			node.appendChild(name, childNode);
			yield [...childTuple];
		} else {
			const extension = childTuple[NODE.DIRECTORY.EXTEND];
			const childNode = new Tree.DirectoryNode(extension);

			node.appendChild(name, childNode);
			yield * build(childTuple, childNode);
		}
	}
}
