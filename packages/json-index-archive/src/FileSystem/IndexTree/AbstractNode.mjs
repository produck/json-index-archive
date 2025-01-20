export class AbstractNode {
	static isNode(value) {
		return value instanceof this;
	}
}
