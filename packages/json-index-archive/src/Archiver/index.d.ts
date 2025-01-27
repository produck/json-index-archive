import * as fs from 'node:fs';

export namespace Index{
	export namespace Tree {
		export interface AbstractNode {
			readonly name: string;
			readonly extension: [...unknown[]]
		}

		export interface FileNode extends AbstractNode {
			offset: string;
			size: number;
		}

		export interface DirectoryNode extends AbstractNode {
			children: (FileNode | DirectoryNode)[]
		}

		export type Node = FileNode | DirectoryNode;
	}
}

declare enum Type {
	File = 0,
	Directory = 1,
}

type FileTuple = [
	type: Type.File,
	name: string,
	offset: string,
	size: string,
	extension: [...unknown[]],
];

type DirectoryTuple = [
	type: Type.Directory,
	name: string,
	children: UnionTuple[],
	extension: [...unknown[]],
];

type UnionTuple = DirectoryTuple | FileTuple;

export interface Archiver {
	entities(): AsyncIterableIterator<fs.Dirent, undefined, unknown>;

	paths(): AsyncIterableIterator<string, undefined, unknown>;

	buildIndex(
		rootChildren?: UnionTuple[]
	): AsyncIterableIterator<
		[fs.Dirent, Index.Tree.Node],
		UnionTuple[],
		unknown
	>;

	archive(destination: string, mode?: number): Promise<undefined>;
}

export interface ArchiverConstructor {
	new(pathname: string): Archiver;
}

export const Archiver: ArchiverConstructor;
