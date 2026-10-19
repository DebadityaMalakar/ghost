import { requireAttribute } from "../lib/errors";
import { notifySubscribers } from "../lib/store";

type StoreValue = number | string | object | null;

/**
 * <store-element name="counter" val="0">
 * Holds a named value. Setting `val` re-renders all bindings.
 */
export class StoreElement extends HTMLElement {
  private _val: StoreValue = null;
  name: string | null = null;

  constructor() {
    super();
    requireAttribute(this, "name");
    this._val = this.getAttribute("val");
    this.name = this.getAttribute("name");
  }

  get val(): StoreValue {
    return this._val;
  }

  set val(newVal: StoreValue) {
    this._val = newVal;
    notifySubscribers();
  }
}
