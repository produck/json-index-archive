import { Dirent } from 'node:fs';
import * as Stream from 'node:stream';

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

export interface JSONIndexArchiver {
	entities(): AsyncIterableIterator<Dirent>;
	paths(): AsyncIterableIterator<string>;
	buildIndex(fileHandler?: FileHandler): Promise<DirectoryNode>;
	archive(destination: string, mode?: number): Promise<undefined>;
}

export interface JSONIndexArchiverConstructor {
	new(): JSONIndexArchiver;
}

export const Archiver: JSONIndexArchiverConstructor;

export interface JSONIndexReaderFileHandle {
	read(buffer: Buffer, options): Promise<undefined>;
	createReadStream(options: Stream.ReadableOptions): Promise<Stream.Readable>;
}

export interface Dirent {
	readonly name: string | Buffer;
	readonly parentPath: string;
	isFile(): boolean;
	isDirectory(): boolean;
}

export interface ReaddirOptions {
	withFileType?: boolean;
	recursive?: boolean;
}

export interface JSONIndexReader {
	readonly archiveSize: bigint;
	readonly fileSize: bigint;
	readonly inddexSize: number;

	sync(): Promise<undefined>;
	open(pathname: string): Promise<JSONIndexReaderFileHandle>;
	exists(pathname: string): boolean;
	readdir(pathname: string, options: ReaddirOptions): Promise<[]>;
	readFile(pathname: string): Promise<Buffer>;
	extractAll(destination: string): Promise<undefined>;

	createReadStream(
		pathname: string,
		options: Stream.ReadableOptions
	): Promise<unknown>;
}

export interface JSONIndexReaderConstructor {
	extractAll(pathname: string, destination: string): Promise<undefined>;
	from(pathname: string): Promise<JSONIndexReader>;
}
