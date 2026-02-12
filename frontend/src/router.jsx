import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Analysis from "./pages/Analysis";
import Results from "./pages/Results";
import Instructions from "./pages/Instructions";
import ComponentDetail from "./pages/ComponentDetail";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/results" element={<Results />} />
      <Route path="/instructions" element={<Instructions />} />
      <Route path="/component/:name" element={<ComponentDetail />} />
    </Routes>
  );
}
