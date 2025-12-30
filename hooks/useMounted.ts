import { useEffect } from "react";

const useMounted = (mountedCallback: Function) => {
  useEffect(() => {
    mountedCallback && mountedCallback();
  }, []);
};

export default useMounted;
