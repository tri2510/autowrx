import RootLayout from "@/layouts/RootLayout";
import PageHome from "@/pages/PageHome";
import PageAbout from "@/pages/PageAbout";
import { RouteObject } from "react-router-dom";

const routesConfig: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [{ index: true, element: <PageHome /> }],
  },
  {
    path: "/about",
    element: <RootLayout />,
    children: [{ index: true, element: <PageAbout /> }],
  },
];

export default routesConfig;
