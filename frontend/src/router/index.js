import React from "react";
import { createBrowserRouter } from "react-router-dom";
import ClassesList from "classesList";
import ClassDetail from "ClassDetail";

export const router = createBrowserRouter([
  { path: "/classes", element: <ClassesList /> },
  { path: "/classes/:id", element: <ClassDetail /> },
]);
