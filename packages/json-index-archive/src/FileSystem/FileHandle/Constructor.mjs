import { AbstractFileHandle } from './Abstract.mjs';

export class FileHandle extends AbstractFileHandle {}

export function implement(name, method) {
	FileHandle.prototype[name] = function (...args) {
		return method(this, ...args);
	};
}
