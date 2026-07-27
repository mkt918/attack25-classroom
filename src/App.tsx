import { useHashRoute } from "./hooks/useHashRoute";
import { Home } from "./pages/Home";
import { ConnectivityCheck } from "./pages/ConnectivityCheck";
import { HostDemo } from "./pages/teacher/HostDemo";
import { StudentPlay } from "./pages/student/StudentPlay";

function App() {
  const segments = useHashRoute();

  if (segments[0] === "check") {
    return <ConnectivityCheck />;
  }
  if (segments[0] === "host-demo") {
    return <HostDemo />;
  }
  if (segments[0] === "play-demo") {
    return <StudentPlay />;
  }

  return <Home />;
}

export default App;
