import React from "react";

export const JsonComponent = ({ state }: { state: any }) => {
  return (
    <small>
      <pre>
        {JSON.stringify(
          state,
          (key, value) => {
            if (typeof value === "bigint") return value.toString();
            return value;
          },
          2
        )}
      </pre>
    </small>
  );
};