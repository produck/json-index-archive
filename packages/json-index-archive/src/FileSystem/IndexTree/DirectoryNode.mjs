import * as Ow from '@produck/ow';
import { Assert, Is } from '@produck/idiom';

import * as Pathname from '../Pathname.mjs';
import { VISIT_AT } from './Constant.mjs';
import { AbstractNode } from './AbstractNode.mjs';
import { FileNode } from './FileNode.mjs';

const CHILDREN = Symbol('children');

export const ORDER = {
	DEFAULT: () => 0,
	TYPE_THEN_NAME: ([nameA, nodeA], [nameB, nodeB]) => {
		if (DirectoryNode.isNode(nodeA) && FileNode.isNode(nodeB)) {
			return -1;
		} else if (FileNode.isNode(nodeA) && DirectoryNode.isNode(nodeB)) {
			return 1;
		}

		return nameA.localeCompare(nameB);
	},
};

export function normalizeChildrenOptions(options = {}) {
	Assert.Type.Object(options, 'options');

	const _options = {
		visitAt: VISIT_AT.SEEK,
		order: ORDER.DEFAULT,
	};

	const {
		visitAt: _visitAt = _options.visitAt,
		order: _order = _options.order,
	} = options;

	Assert.Integer(_visitAt, 'visitAt');

	if (_visitAt < 0 || _visitAt > VISIT_AT.ALL) {
		Ow.Error.Range(`A "options.visitAt" MUST NOT be < 0 or > ${VISIT_AT.ALL}.`);
	}

	Assert.Type.Function(_order, 'options.order');

	_options.visitAt = _visitAt;
	_options.order = _order;

	return _options;
}

export class DirectoryNode extends AbstractNode {
	[CHILDREN] = {};

	getChild(name) {
		Assert.Type.String(name, 'name');

		const child = this[CHILDREN][name];

		return Is.Type.Undefined(child) ? null : child;
	}

	appendChild(name, node) {
		Assert.Type.String(name, 'name');

		if (!DirectoryNode.isNode(node) && !FileNode.isNode(node)) {
			Ow.Invalid('node', 'FileNode | DirectoryNode');
		}

		if (this.getChild(name) !== null) {
			Ow.Error.Common(`Duplicated name "${name}".`);
		}

		this[CHILDREN][name] = node;
	}

	*[Symbol.iterator]() {
		const { [CHILDREN]: children } = this;

		for (const name in children) {
			yield Object.freeze([name, children[name]]);
		}
	}

	find(...sections) {
		if (sections.length === 0) {
			return this;
		}

		sections.forEach(Pathname.assertSection);

		const child = this.getChild(sections.shift());

		if (sections.length === 0) {
			return child;
		}

		if (DirectoryNode.isNode(child)) {
			return child.find(...sections);
		}

		return null;
	}

	records(order = ORDER.DEFAULT) {
		Assert.Type.Function(order, 'order');

		return [...this].sort(order);
	}

	*children(depth = 1, ..._options) {
		Assert.Integer(depth, 'depth');

		const options = normalizeChildrenOptions(..._options);

		if (depth < 1) {
			return;
		}

		for (const record of this.records(options.order)) {
			if (options.visitAt & VISIT_AT.SEEK) {
				yield record;
			}

			const childNode = record[1];

			if (DirectoryNode.isNode(childNode)) {
				yield * childNode.children(depth - 1, options);
			}

			if (options.visitAt & VISIT_AT.DONE) {
				yield record;
			}
		}
	}
}
