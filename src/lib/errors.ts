/** Shows an error message on the page and returns it as an Error. */
export const createError = (message: string, type = "Error"): Error => {
  const error = new Error(message);
  error.name = type;

  const errorElement = document.createElement("div");
  errorElement.className = "error";
  errorElement.textContent = `${error.name}: ${error.message}`;
  (document.body ?? document.documentElement)?.appendChild(errorElement);

  return error;
};

/** Reports an AttributeError if `element` is missing `attribute`. */
export const requireAttribute = (element: HTMLElement, attribute: string) => {
  if (element.hasAttribute(attribute)) return;
  createError(
    `The '${attribute}' attribute is required for the <${element.localName}> element.`,
    "AttributeError"
  );
};
