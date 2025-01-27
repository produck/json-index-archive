import * as Stream from 'node:stream';

export type Encoding = string | null;

export interface ReadStreamOptions {
	encoding?: Encoding;
	autoClose?: boolean;
	emitClose?: boolean;
	start?: undefined | number;
	end?: number;
	highWaterMark?: number;
	signal?: undefined | AbortSignal;
}

export interface ReadOptions {
	offset?: number;
	position?: number | null;
	buffer?: Buffer;
	length?: number;
}

export interface ReadResult {
	bytesRead: number;
	buffer: Buffer;
}

export interface ReadFileOptions {
	encoding: Encoding;
	signal: AbortSignal | undefined;
}

export interface ReadStream extends Stream.Readable {
	readonly path: string;
	readonly bytesRead: number;
	readonly pending: boolean;
}

export interface FileHandle {
	readonly fd: number;

	read(): Promise<ReadResult>;
	read(buffer: Buffer): Promise<ReadResult>;
	read(options: ReadOptions): Promise<ReadResult>;
	read(buffer: Buffer, options: Omit<ReadOptions, 'buffer'>): Promise<ReadResult>;
	read(buffer: Buffer, offset: number): Promise<ReadResult>;
	read(buffer: Buffer, offset: number, length: number): Promise<ReadResult>;
	read(buffer: Buffer, offset: number, length: number, position: number): Promise<ReadResult>;

	createReadStream(): ReadStream;
	createReadStream(options: ReadStreamOptions): ReadStream;

	readFile(): Promise<Buffer>;
	readFile(encoding: Encoding): Promise<Buffer>;
	readFile(options: ReadFileOptions): Promise<Buffer>;
}

export interface Dirent {
	readonly name: string | Buffer;
	readonly parentPath: string;
	isFile(): boolean;
	isDirectory(): boolean;
}

export interface Stat {
	readonly size: number;
	readonly mode: number;
	readonly birthtimeMs: number;
	readonly birthtime: Date;
	isFile(): boolean;
	isDirectory(): boolean;
}

export interface ReaddirOptions {
	withFileTypes?: boolean;
	recursive?: boolean;
}

export interface FileSystem {
	readonly archiveSize: bigint;
	readonly fileSize: bigint;
	readonly inddexSize: number;

	open(pathname: string): Promise<FileHandle>;

	exists(pathname: string): boolean;

	readdir<
		CustomOptions extends ReaddirOptions
	>(
		pathname: string,
		options: CustomOptions
	): CustomOptions['withFileTypes'] extends true ? Dirent[] : string[];

	readFile(
		pathname: string,
		options: ReadFileOptions,
	): Promise<Buffer>;

	stat(pathname: string): Stat;

	createReadStream(
		pathname: string,
		options: ReadStreamOptions,
	): ReadStream;

	sync(): Promise<undefined>;
}

export interface FileSystemConstructor {
	mount(pathname: string): Promise<FileSystem>;
}

export const FileSystem: FileSystemConstructor;
