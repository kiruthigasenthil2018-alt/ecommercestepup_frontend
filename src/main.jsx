import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AppProvider } from "./context.jsx";
import "./styles.css";

class Boundary extends React.Component {
  state = { e: null };
  static getDerivedStateFromError(e) { return { e }; }
  reset = () => { localStorage.clear(); sessionStorage.clear(); window.location.href = "/"; };
  render() {
    if (!this.state.e) return this.props.children;
    return (<div style={{ padding: 24, fontFamily: "sans-serif" }}><h2>Something went wrong</h2><pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.e.message)}</pre>
      <p>Try reloading (Ctrl+Shift+R). If it continues, clear the saved cart data:</p><button onClick={this.reset}>Clear saved data &amp; go home</button></div>);
  }
}
createRoot(document.getElementById("root")).render(<Boundary><BrowserRouter><AppProvider><App /></AppProvider></BrowserRouter></Boundary>);
