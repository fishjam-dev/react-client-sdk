import { LogSelector } from "./LogSelector";
import { Server } from "./Server";

const App = () => {
  return (
    <>
      <div className="flex flex-col fixed bottom-4 right-4">
        <LogSelector />
      </div>
      <Server />
    </>
  );
};

export default App;
