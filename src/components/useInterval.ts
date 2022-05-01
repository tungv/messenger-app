import { useEffect, useLayoutEffect, useRef } from "react";

export default function useInterval(cb: () => () => void, delay: number) {
  const fnRef = useRef(cb);
  const unsubRef = useRef(() => {});

  useLayoutEffect(() => {
    fnRef.current = cb;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      unsubRef.current = fnRef.current();
    }, delay);

    return () => {
      clearInterval(interval);
      unsubRef.current?.();
    };
  }, [delay]);
}
