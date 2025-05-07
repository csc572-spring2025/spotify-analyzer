import logo from "./logo.svg";
import "./App.css";
import Welcome from "./Welcome";

function App() {
  return (
    <>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
      <div className="Welcome">
        <Welcome />
        <h1>Welcome to React</h1>
        <h2>Welcome to React</h2>
        <p>
          This is a simple React application that demonstrates how to create a
          component and use it in the main App component.
        </p>
      </div>
    </>
  );
}

export default App;
