import { RefCallback, useCallback, useEffect, useRef, useState } from "react";

export default function useInfiniteScroll(onLoadMore: () => Promise<void>) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentryRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  // synchronize sentry visibility with loadMore "effect"
  useEffect(() => {
    if (visible) {
      const id = setTimeout(onLoadMore, 50);
      return () => clearTimeout(id);
    }
  }, [visible, onLoadMore]);

  // unload current observer and set sentry visibility to false
  const unobserve = useCallback(function unobserve() {
    const currentObserver = observerRef.current;
    if (currentObserver) {
      currentObserver.disconnect();
    }
    observerRef.current = null;
    setVisible(false);
  }, []);

  // create an instance of IntersectionObserver
  // with default options and a stable handler
  // that handler will only change visibility status of the sentry
  const observe = useCallback(function initIntersectionObserver() {
    if (sentryRef.current) {
      const options = {
        root: containerRef.current,
        rootMargin: "0px",
        threshold: 0,
      };

      const observer = new IntersectionObserver((entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }, options);

      // capture the current observer to this hook entire lifecycle
      observerRef.current = observer;

      // start observing the sentry DOM node
      observer.observe(sentryRef.current);
    }
  }, []);

  // this is the ref callback to attach on sentry JSX element
  // to avoid unnecessary rerender, we need to stablize this callback
  // react will unload and reload the callback ref if it changes
  const loadMoreRefCallback: RefCallback<HTMLDivElement> = useCallback(
    (el) => {
      sentryRef.current = el;

      unobserve();
      observe();
    },
    [observe, unobserve],
  );

  // this is the ref callback to attach on container JSX element
  const containerRefCallback: RefCallback<HTMLDivElement> = useCallback(
    (el) => {
      containerRef.current = el;
      unobserve();
      observe();
    },
    [observe, unobserve],
  );

  return {
    containerRef: containerRefCallback,
    loadMoreRef: loadMoreRefCallback,
  };
}
