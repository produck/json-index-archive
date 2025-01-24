export class JIARError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code;
	}
}

export const ENOENT = (pathname, operation) => {
	const message = `no such file or directory, ${operation} '${pathname}'`;

	return new JIARError(message, 'ENOENT');
};
