import React from "react";
import { createBrowserRouter } from "react-router-dom";
import ClassesList from "../pages/classesList";
import ClassDetail from "../pages/classDetail";
import CreateClassPage from "../pages/createClass";

export const router = createBrowserRouter([
  { path: "/classes", element: <ClassesList /> },
  { path: "/classes/new", element: <CreateClassPage /> },
  { path: "/classes/:id", element: <ClassDetail /> },
]);
