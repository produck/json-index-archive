import { AbstractFileSystem } from './Abstract.mjs';

export class FileSystem extends AbstractFileSystem {}

export function implement(name, method) {
	FileSystem.prototype[name] = function (...args) {
		return method(this, ...args);
	};
}
