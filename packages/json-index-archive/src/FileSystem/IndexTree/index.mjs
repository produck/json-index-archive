export { VISIT_AT } from './Constant.mjs';
import { FileNode } from './FileNode.mjs';
import { DirectoryNode, ORDER } from './DirectoryNode.mjs';

export { FileNode, DirectoryNode, ORDER };

export function isNode(value) {
	return FileNode.isNode(value) || DirectoryNode.isNode(value);
}
