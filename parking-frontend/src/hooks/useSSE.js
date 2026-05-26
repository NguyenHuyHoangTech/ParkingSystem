import { useEffect, useRef } from 'react';

const useSSE = (events, callbacks) => {
  const callbacksRef = useRef(callbacks);
  const eventsRef = useRef(events);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    let eventSource = null;
    let reconnectTimer = null;

    const connect = () => {
      eventSource = new EventSource('http://localhost:8080/api/notifications/subscribe');

      eventSource.onopen = () => {
        console.log('SSE connection opened');
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        // Auto-reconnect after 3 seconds
        reconnectTimer = setTimeout(connect, 3000);
      };

      // Bind specific events to their callbacks
      eventsRef.current.forEach((event, index) => {
        eventSource.addEventListener(event, (e) => {
          console.log(`Received event: ${event}`, e.data);
          if (callbacksRef.current[index]) {
            callbacksRef.current[index](e.data);
          }
        });
      });
    };

    connect();

    return () => {
      console.log('Closing SSE connection');
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) eventSource.close();
    };
  }, []); // Only run once on mount
};

export default useSSE;
