import type { StoreElement } from "../elements/store-element";

type Subscriber = () => void;

const subscribers: Subscriber[] = [];

/** Runs `fn` every time any store value changes. */
export const subscribe = (fn: Subscriber) => {
  subscribers.push(fn);
};

export const notifySubscribers = () => {
  subscribers.forEach((fn) => fn());
};

/** Finds the <store-element> with the given name, if any. */
export const findStore = (name: string) =>
  document.querySelector<StoreElement>(`store-element[name="${name.trim()}"]`);
