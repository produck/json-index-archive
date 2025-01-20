import * as IndexTree from './IndexTree.mjs';
import { Assert, Is } from '@produck/idiom';

async function* visit(object, node) {
	Assert.Type.Object(object, 'object');

	for (const childObject of object.children) {
		const { name, children } = childObject;

		Assert.Type.String(name, '.name');

		if (Is.Type.Undefined(children)) {
			const { offset, size, sha256 } = childObject;

			Assert.Type.String(offset, '.offset');
			Assert.Type.String(size, '.size');
			Assert.Type.String(sha256, '.size');

			const offsetNumber = Number(offset);
			const sizeNumber = Number(size);
			const childNode = new IndexTree.FileNode(offsetNumber, sizeNumber);

			node.appendChild(name, childNode);
			yield [offsetNumber, sizeNumber, sha256];
		} else {
			Assert.Array(children, '.children');

			const childNode = new IndexTree.DirectoryNode();

			node.appendChild(name, childNode);
			yield * visit(childObject, childNode);
		}
	}
}

export function* buildTree(indexObject, callback) {
	Assert.Type.Object(indexObject, 'indexObject');

	const root = new IndexTree.DirectoryNode();

	yield * visit(indexObject, root);
	callback(root);
}
