import Clarity from "@microsoft/clarity";
import { StrictMode, Suspense } from "react";
import type { FunctionComponent } from "react";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";

import { App } from "./app";

Clarity.init("r8tfd2woc6");

const Index: FunctionComponent = () => (
  <StrictMode>
    <Suspense>
      <SWRConfig value={{ suspense: true }}>
        <App />
      </SWRConfig>
    </Suspense>
  </StrictMode>
);

const container = document.createElement("div");
document.body.append(container);
createRoot(container).render(<Index />);
