const EXTENSION = Symbol('extension');

export class AbstractNode {
	[EXTENSION] = null;

	get extension() {
		return this[EXTENSION];
	}

	constructor(extension = null) {
		this[EXTENSION] = extension;
	}

	static isNode(value) {
		return value instanceof this;
	}
}
