import { FileNode } from './FileNode.mjs';
import { DirectoryNode, ORDER } from './DirectoryNode.mjs';
export { VISIT_AT } from './Constant.mjs';

export function isNode(value) {
	return FileNode.isNode(value) || DirectoryNode.isNode(value);
}

export { DirectoryNode, FileNode, ORDER };
