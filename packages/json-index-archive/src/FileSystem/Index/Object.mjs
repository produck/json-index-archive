import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';
import * as Tree from './Tree.mjs';

export const TYPE = { FILE: 0, DIRECTORY: 1 };

export const NODE = {
	TYPE: 0, NAME: 1,
	DIRECTORY: { CHILDREN: 2, EXTEND: 3 },
	FILE: { OFFSET: 2, SIZE: 3, EXTEND: 4 },
};

export function* build(children, node) {
	Assert.Array(children, `DirectoryTuple[${NODE.DIRECTORY.CHILDREN}]`);

	if (!Tree.isNode(node)) {
		Ow.Invalid('node', 'FileNode | DirectoryNode');
	}

	for (const childTuple of children) {
		const type = childTuple[NODE.TYPE];
		const name = childTuple[NODE.NAME];

		Assert.Type.String(name, `Tuple[${NODE.NAME}]`);

		if (type === TYPE.FILE) {
			const offset = childTuple[NODE.FILE.OFFSET];
			const size = childTuple[NODE.FILE.SIZE];

			Assert.Type.String(offset, `FileTuple[${NODE.FILE.OFFSET}]`);
			Assert.Type.String(size, `FileTuple[${NODE.FILE.SIZE}]`);

			const offsetNumber = Number(offset);

			if (Is.NaN(offsetNumber)) {
				Ow.Error.Common(`"FileTuple[${NODE.FILE.OFFSET}]" SHOULD NOT be NaN.`);
			}

			const sizeNumber = Number(size);

			if (Is.NaN(sizeNumber)) {
				Ow.Error.Common(`"FileTuple[${NODE.FILE.SIZE}]" SHOULD NOT be NaN.`);
			}

			const extension = childTuple[NODE.FILE.EXTEND];
			const childNode = new Tree.FileNode(offsetNumber, sizeNumber, extension);

			node.appendChild(name, childNode);
			yield [...childTuple];
		}

		if (type === TYPE.DIRECTORY) {
			const extension = childTuple[NODE.DIRECTORY.EXTEND];
			const childNode = new Tree.DirectoryNode(extension);

			node.appendChild(name, childNode);
			yield * build(childTuple[NODE.DIRECTORY.CHILDREN], childNode);
		}
	}
}
