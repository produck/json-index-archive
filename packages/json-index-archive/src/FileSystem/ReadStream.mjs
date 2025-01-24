import { Readable } from 'node:stream';
import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';

import { FileHandle } from './FileHandle/index.mjs';

function normalizeDescriptor(descriptor) {
	const _descriptor = {
		path: undefined,
	};

	const {
		fetchFileHandle: _fetchFileHandle,
		path: _path = _descriptor.path,
	} = descriptor;

	Assert.Type.Function(_fetchFileHandle, 'descriptor.fetchFileHandle');

	if (!Is.Type.String(_path) && !Is.Type.Undefined(_path)) {
		Ow.Invalid('descriptor.path', 'string | undefined');
	}

	_descriptor.fetchFileHandle = _fetchFileHandle;
	_descriptor.path = _path;

	return _descriptor;
}

function normalizeOptions(options = {}) {
	Assert.Type.Object(options, 'options');

	const _options = {
		encoding: null,
		autoClose: true,
		emitClose: true,
		start: 0,
		end: Infinity,
		highWaterMark: 64 * 1024,
		signal: undefined,
	};

	const {
		encoding: _encoding = _options.encoding,
		autoClose: _autoClose = _options.autoClose,
		emitClose: _emitClose = _options.emitClose,
		start: _start = _options.start,
		end: _end = _options.end,
		highWaterMark: _highWaterMark = _options.highWaterMark,
		signal: _signal = _options.signal,
	} = options;

	if (!Is.Null(_encoding) && !Is.Type.String(_encoding)) {
		Ow.Invalid('options.encoding', 'null | string');
	}

	Assert.Type.Boolean(_autoClose, 'options.autoClose');
	Assert.Type.Boolean(_emitClose, 'options.emitClose');
	Assert.Integer(_start, 'options.start');

	if (!Is.Integer(_end) && _end !== Infinity) {
		Ow.Invalid('options.end', 'Integer | Infinity');
	}

	Assert.Integer(_highWaterMark, 'options.highWaterMark');

	if (!Is.Type.Undefined(_signal) && (_signal instanceof AbortSignal)) {
		Ow.Invalid('options.signal', 'undefined | AbortSignal');
	}

	_options.encoding = _encoding;
	_options.autoClose = _autoClose;
	_options.emitClose = _emitClose;
	_options.start = _start;
	_options.end = _end;
	_options.highWaterMark = _highWaterMark;
	_options.signal = _signal;

	return _options;
}

export class ReadStream extends Readable {
	#path = undefined;

	get path() {
		return this.#path;
	}

	#bytesRead = 0;

	get bytesRead() {
		return this.#bytesRead;
	}

	#fetching;
	#handle = null;

	get pending() {
		return this.#handle === null ? true : false;
	}

	constructor(descriptor, ...options) {
		const { path, fetchFileHandle } = normalizeDescriptor(descriptor);
		const { start, end, autoClose, ...streamOpts } = normalizeOptions(...options);

		super({ ...streamOpts, autoDestroy: autoClose });
		this.#path = path;

		const value = fetchFileHandle();

		if (value instanceof FileHandle) {
			this.#handle = value;
		} else {
			this.#fetching = value;
		}
	}

	async _construct(callback) {
		try {
			const handle = Is.Null(this.#handle)
				? await this.#fetching
				: this.#handle;

			handle.on('close', () => this.destroy());
			this.#handle = handle;
			this.emit('open', handle);
			this.emit('ready');
			callback();
		} catch (error) {
			callback(error);
		}
	}

	async _read(size) {
		try {
			const handle = this.#handle;
			const alloced = Buffer.alloc(size);
			const { buffer, bytesRead } = await handle.read(alloced, 0, size, null);

			this.#bytesRead += bytesRead;
			this.push(bytesRead > 0 ? buffer.slice(0, bytesRead) : null);
		} catch (error) {
			this.destroy(error);
		}
	}

	async _destroy(err, callback) {
		try {
			if (err) {
				callback(err);
			}

			if (!Is.Null(this.#handle)) {
				await this.#handle.close();
				callback();
			}
		} catch (handleError) {
			callback(handleError);
		}
	}
}
