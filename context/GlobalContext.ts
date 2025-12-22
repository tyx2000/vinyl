import { createContext, useContext } from "react";

let values: Record<string, any> = {};

export const GlobalContext = createContext(values);

export const useGlobalContext = () => useContext(GlobalContext);
