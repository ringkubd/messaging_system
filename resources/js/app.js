import "./bootstrap";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./ui/App";

const rootElement = document.getElementById("app");

if (rootElement) {
    const root = createRoot(rootElement);

    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </React.StrictMode>,
    );
}
