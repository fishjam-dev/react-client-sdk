import { useState } from "react";
import { getBooleanValue } from "../../../src/jellyfish/addLogging";

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
  return (
    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
      <PersistentInput name="onJoinSuccess"/>
      <PersistentInput name="onJoinError"/>
      <PersistentInput name="onRemoved"/>
      <PersistentInput name="onPeerJoined"/>
      <PersistentInput name="onPeerLeft"/>
      <PersistentInput name="onPeerUpdated"/>
      <PersistentInput name="onTrackReady"/>
      <PersistentInput name="onTrackAdded"/>
      <PersistentInput name="onTrackRemoved"/>
      <PersistentInput name="onTrackUpdated"/>
      <PersistentInput name="onTrackEncodingChanged"/>
      <PersistentInput name="onTracksPriorityChanged"/>
      <PersistentInput name="onBandwidthEstimationChanged"/>
    </div>
  );
};
const PersistentInput = ({ name }: { name: string }) => {
  const [value, setValue] = useLocalStorageState(name);

  return (
    <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
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