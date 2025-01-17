
export class FileHandle {
	#reader;
	#pathname = '';
	#position;

	constructor(reader, pathname) {
		this.#reader = reader;
		this.#pathname = pathname;
	}

	get reader() {
		return this.#reader;
	}

	async close() {

	}

	async read(buffer, options) {
		// https://nodejs.org/dist/v20.18.1/docs/api/fs.html#filehandlereadbuffer-options
	}

	async createReadStream(options) {
		// https://nodejs.org/dist/v20.18.1/docs/api/fs.html#filehandlecreatereadstreamoptions
	}
}
