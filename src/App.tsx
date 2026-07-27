import { useHashRoute } from "./hooks/useHashRoute";
import { Home } from "./pages/Home";
import { ConnectivityCheck } from "./pages/ConnectivityCheck";

function App() {
  const segments = useHashRoute();

  if (segments[0] === "check") {
    return <ConnectivityCheck />;
  }

  return <Home />;
}

export default App;
