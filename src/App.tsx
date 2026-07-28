import { useHashRoute } from "./hooks/useHashRoute";
import { Home } from "./pages/Home";
import { ConnectivityCheck } from "./pages/ConnectivityCheck";
import { Dashboard } from "./pages/teacher/Dashboard";
import { Join } from "./pages/student/Join";
import { StudentPlay } from "./pages/student/StudentPlay";

function App() {
  const segments = useHashRoute();

  if (segments[0] === "check") {
    return <ConnectivityCheck />;
  }
  if (segments[0] === "teacher") {
    return <Dashboard />;
  }
  if (segments[0] === "join") {
    return <Join />;
  }
  if (segments[0] === "play" && segments[1] && segments[2]) {
    return <StudentPlay sessionId={segments[1]} roomId={segments[2]} />;
  }

  return <Home />;
}

export default App;
