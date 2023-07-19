import { useState } from "react";
import { getBooleanValue } from "../utils/localStorageUtils";

export const useLocalStorageState = (name: string, defaultValue?: boolean): [boolean, (newValue: boolean) => void] => {
  const [value, setValueState] = useState<boolean>(getBooleanValue(name, defaultValue));

  const setValue = (newValue: boolean) => {
    setValueState(newValue);
    localStorage.setItem(name, newValue.toString());
  };

  return [value, setValue];
};

export const getStringValue = (name: string, defaultValue: string | null = null): string | null => {
  const stringValue = localStorage.getItem(name);
  if (stringValue === null || stringValue === undefined) {
    return defaultValue;
  }
  return stringValue;
};

export const getLocalStorage = <Value extends string>(name: string, defaultValue: Value): Value => {
  const stringValue = localStorage.getItem(name);
  if (stringValue === null || stringValue === undefined) {
    return defaultValue;
  }
  // todo remove `as`
  return stringValue as Value;
};

export const usePersistentRadio = <Value extends string>(
  name: string,
  defaultValue: Value
): [Value, (newValue: Value) => void] => {
  const [innerValue, setInnerValue] = useState<Value>(getLocalStorage<Value>(name, defaultValue));

  const setValue = (newValue: Value) => {
    setInnerValue(newValue);
    if (newValue === null) {
      localStorage.removeItem(name);
    } else {
      localStorage.setItem(name, newValue);
    }
  };

  return [innerValue, setValue];
};

export const useLocalStorageStateString = (
  name: string,
  defaultValue?: string
): [string | null, (newValue: string | null) => void] => {
  const [value, setValueState] = useState<string | null>(getStringValue(name, defaultValue));

  const setValue = (newValue: string | null) => {
    setValueState(newValue);
    if (newValue === null) {
      localStorage.removeItem(name);
    } else {
      localStorage.setItem(name, newValue);
    }
  };

  return [value, setValue];
};

export const LogSelector = () => {
  return (
    <div className="card bg-base-100 shadow-xl flex flex-col m-2">
      <div className="card-body mt-4">
        <PersistentInput name="onJoinSuccess" />
        <PersistentInput name="onJoinError" />

        <PersistentInput name="onRemoved" />

        <PersistentInput name="onPeerJoined" />
        <PersistentInput name="onPeerUpdated" />
        <PersistentInput name="onPeerLeft" />

        <PersistentInput name="onComponentAdded" />
        <PersistentInput name="onComponentUpdated" />
        <PersistentInput name="onComponentRemoved" />

        <PersistentInput name="onTrackAdded" />
        <PersistentInput name="onTrackReady" />
        <PersistentInput name="onTrackUpdated" />
        <PersistentInput name="onTrackRemoved" />

        <PersistentInput name="onTrackEncodingChanged" />
        <PersistentInput name="onTracksPriorityChanged" />
        <PersistentInput name="onBandwidthEstimationChanged" />
        <PersistentInput name="onEncodingChanged" />
      </div>
    </div>
  );
};

export const PersistentInput = ({ name }: { name: string }) => {
  const [value, setValue] = useLocalStorageState(name);

  return (
    <div className="form-control flex flex-row flex-wrap content-center">
      <label className="label cursor-pointer">
        <input
          className="checkbox"
          id={name}
          type="checkbox"
          checked={value}
          onChange={() => {
            setValue(!value);
          }}
        />
        <span className="label-text ml-2">{name}</span>
      </label>
    </div>
  );
};
