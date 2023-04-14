import type { State } from "../state.types";

/**
 * Create a cache for a result of a function
 *
 * @param isEqual - function that compares two values
 * @param callbackFunction - function that returns a value
 * @returns cached function
 */
export const cache = <Result, PeerMetadata, TrackMetadata>(
  isEqual: (value: any, other: any) => boolean,
  callbackFunction: (snapshot: State<PeerMetadata, TrackMetadata>) => Result
): ((snapshot: State<PeerMetadata, TrackMetadata>) => Result) => {
  // console.log("%c Create cache", "color: orange");
  let cache: any = undefined;

  return (innerSnapshot) => {
    const result = callbackFunction(innerSnapshot);

    if (isEqual(cache, result)) {
      // console.log("%c Return cache", "color: green");
      return cache;
    }
    // console.log("%c Return new", "color: red");

    cache = result;

    return cache;
  };
};