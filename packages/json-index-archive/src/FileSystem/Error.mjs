export class JIARError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code;
	}
}

export const ENOENT = pathname => {
	const message = `no such file or directory, open '${pathname}'`;

	return new JIARError(message, 'ENOENT');
};
