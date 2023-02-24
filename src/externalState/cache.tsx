import type { State } from "../state.types";

// todo extract equality function and remove lodash
import isEqual from "lodash.isequal";

export const cache = <Result, PeerMetadata, TrackMetadata>(
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
