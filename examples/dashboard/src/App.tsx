const Client = () => {
  return (
    <article style={{ width: "300px", margin: "8px" }}>
      <span>Client 1</span>
    </article>
  );
};

const App = () => (
  <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
    <Client />
    <Client />
    <Client />
    <article style={{ margin: "8px", width: "300px" }}></article>
  </div>
);

export default App;
