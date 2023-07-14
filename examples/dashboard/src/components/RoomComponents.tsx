import React, { FC, useState } from "react";
import { useServerSdk } from "./ServerSdkContext";
import { useLocalStorageStateString } from "./LogSelector";
import { Component } from "../server-sdk";
import { ComponentId } from "../../../../src";
import { CloseButton } from "./CloseButton";
import { removeSavedItem } from "../utils/localStorageUtils";
import { CopyToClipboardButton } from "./CopyButton";
import { JsonComponent } from "./JsonComponent";
import { Client } from "./Client";

type SingleComponentProp = {
  roomId: string;
  component: Component;
  refetchIfNeeded: () => void;
};

const SingleComponent: FC<SingleComponentProp> = ({ component, roomId, refetchIfNeeded }) => {
  const { componentApi } = useServerSdk();

  return (
    <div className="w-full card bg-base-100 shadow-xl indicator">
      <CloseButton
        onClick={() => {
          componentApi?.jellyfishWebComponentControllerDelete(roomId, component.id).then((response) => {
            refetchIfNeeded();
          });
        }}
      />
      <div className="card-body p-4">
        <div className="flex flex-col">
          <div className="flex flex-row justify-between">
            <p className="card-title">
              <div className={`badge badge-lg ${component.type === "hls" ? "badge-primary" : "badge-secondary"} badge-outline`}>
                {component.type}
              </div>
              {component.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

type Props = {
  roomId: string;
  components: Component[] | undefined;
  refetchIfNeeded: () => void;
};

const RoomComponents: FC<Props> = ({ components, refetchIfNeeded, roomId }) => {
  return (
    <div className="flex w-full flex-col gap-2">
      {components &&
        Object.values(components).map((component) => (
          <SingleComponent key={component.id} component={component} roomId={roomId} refetchIfNeeded={refetchIfNeeded} />
        ))}
    </div>
  );
};

export default RoomComponents;
