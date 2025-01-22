import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';
import * as Tree from './Tree.mjs';

export function* build(object, node) {
	Assert.Type.Object(object, 'object');

	if (!Tree.isNode(node)) {
		Ow.Invalid('node', 'FileNode | DirectoryNode');
	}

	Assert.Array(object.children, '.children');

	for (const childObject of object.children) {
		const { name, children } = childObject;

		Assert.Type.String(name, '.name');

		if (Is.Type.Undefined(children)) {
			const { offset, size } = childObject;

			Assert.Type.String(offset, '.offset');
			Assert.Type.String(size, '.size');

			const offsetNumber = Number(offset);

			if (Is.NaN(offsetNumber)) {
				Ow.Error.Common('".offset" SHOULD NOT be NaN.');
			}

			const sizeNumber = Number(size);

			if (Is.NaN(sizeNumber)) {
				Ow.Error.Common('".size" SHOULD NOT be NaN.');
			}

			const childNode = new Tree.FileNode(offsetNumber, sizeNumber);

			node.appendChild(name, childNode);
			yield { ...childObject };
		} else {
			const childNode = new Tree.DirectoryNode();

			node.appendChild(name, childNode);
			yield * build(childObject, childNode);
		}
	}
}
