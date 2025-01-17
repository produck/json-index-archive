const tokens = new WeakSet();

export function create() {
	const token = {};

	tokens.add(token);

	return token;
}

export function has(token) {
	return tokens.has(token);
}
