import type { ActionReturn } from "svelte/action";
import type { Writable } from "svelte/store";

interface BindValueOptions<T, P extends string> {
	store: Writable<T>;
	property?: P;
}

export function bindValue<T, P extends string = "value">(
	node: HTMLElement,
	storeOrOptions: Writable<T> | BindValueOptions<T, P>,
): ActionReturn {
	let store: Writable<T>;
	let valueProperty: P;

	if ("subscribe" in storeOrOptions) {
		store = storeOrOptions;
		valueProperty = "value" as P;
	} else {
		store = storeOrOptions.store;
		valueProperty = storeOrOptions.property ?? ("value" as P);
	}

	if (!(valueProperty in node)) {
		throw new Error(
			`You cannot use bindValue with element that doesn't have '${valueProperty}' attribute`,
		);
	}

	const typedNode = node as { [k in P]: T };

	function bindingEventListener(): void {
		store.set(typedNode[valueProperty]);
	}

	node.addEventListener("input", bindingEventListener);

	const unsubscribe = store.subscribe((value) => {
		typedNode[valueProperty] = value;
	});

	return {
		destroy() {
			node.removeEventListener("input", bindingEventListener);
			unsubscribe();
		},
	};
}
