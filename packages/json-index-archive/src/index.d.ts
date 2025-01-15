import { Dirent } from 'node:fs';

interface AbstractNode {
	name: string;
}

interface FileNode extends AbstractNode {
	offset?: string;
	size?: number;
	sha256?: string;
}

interface DirectoryNode extends AbstractNode {
	children: (FileNode | DirectoryNode)[]
}

type FileHandler = (
	dirent: Dirent,
	node: FileNode
) => Promise<unknown> | unknown;

export interface Archiver {
	entities(): AsyncIterableIterator<Dirent>;
	paths(): AsyncIterableIterator<string>;
	buildIndex(handleFile?: FileHandler): Promise<DirectoryNode>;
	archive(destination: string, mode?: number): Promise<undefined>;
}
