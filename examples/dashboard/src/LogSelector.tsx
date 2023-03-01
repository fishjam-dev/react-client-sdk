import { useState } from "react";
import { getBooleanValue } from "../../../src/jellyfish/addLogging";
import { ThemeSelector } from "./ThemeSelector";

const useLocalStorageState = (
  name: string
): [boolean, (newValue: boolean) => void] => {
  const [value, setValueState] = useState<boolean>(getBooleanValue(name));

  const setValue = (newValue: boolean) => {
    setValueState(newValue);
    localStorage.setItem(name, newValue.toString());
  };

  return [value, setValue];
};
export const LogSelector = () => {
  const [show, setShow] = useLocalStorageState("show-log-selector");

  return (
    <article className="flex flex-col m-1 p-4">
      {show ? (
        <>
          <div className="mt-4">
            <PersistentInput name="onJoinSuccess" />
            <PersistentInput name="onJoinError" />
            <PersistentInput name="onRemoved" />
            <PersistentInput name="onPeerJoined" />
            <PersistentInput name="onPeerLeft" />
            <PersistentInput name="onPeerUpdated" />
            <PersistentInput name="onTrackReady" />
            <PersistentInput name="onTrackAdded" />
            <PersistentInput name="onTrackRemoved" />
            <PersistentInput name="onTrackUpdated" />
            <PersistentInput name="onTrackEncodingChanged" />
            <PersistentInput name="onTracksPriorityChanged" />
            <PersistentInput name="onBandwidthEstimationChanged" />
          </div>
          <div className="flex flex-row justify-between">
            <ThemeSelector />
            <button className="w-[initial] mb-0" onClick={() => setShow(!show)}>
              Hide
            </button>
          </div>
        </>
      ) : (
        <button className="w-[initial] mb-0" onClick={() => setShow(!show)}>
          Options
        </button>
      )}
    </article>
  );
};

export const PersistentInput = ({ name }: { name: string }) => {
  const [value, setValue] = useLocalStorageState(name);

  return (
    <div className="flex flex-row">
      <input
        id={name}
        type="checkbox"
        checked={value}
        onChange={() => {
          setValue(!value);
        }}
      />
      <label htmlFor={name}>{name}</label>
    </div>
  );
};
