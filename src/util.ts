/**
 * Wraps DOM selector methods
 */
export abstract class dom {
  /**
   * Returns document.querySelector
   * @param arg selector to query for
   */
  public static query(arg: string): Element | Element[] | undefined {
    return document.querySelector(arg);
  }

  /**
   * Returns document.getElementById
   * @param arg id to query for
   */
  public static id(arg: string): Element | undefined {
    return document.getElementById(arg);
  }

  /**
   * Returns document.getElementsByClassName
   * @param arg class to query for
   */
  public static class(arg: string): HTMLCollectionOf<Element> | undefined {
    return document.getElementsByClassName(arg);
  }

  /**
   * Returns query or the provided element
   * @param el
   */
  public static element(el: string | Element): Element | Element[] | undefined {
    return typeof el === 'string' ? this.query(el) : el;
  }
}

/**
 * Converts a string to proper case (e.g. 'camera' => 'Camera')
 * @param text Text to transform
 */
export const properCase = (text: string): string => {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
};
