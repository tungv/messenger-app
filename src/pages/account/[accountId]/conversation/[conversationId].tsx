import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useInfiniteScroll from "../../../../components/useInfiniteScroll";

export default function ConversationPage() {
  const router = useRouter();
  const {
    query: { accountId, conversationId },
  } = router;

  return (
    <div className="container">
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: row;
        }

        aside {
          width: 200px;
        }

        div {
          flex: 1;
        }
      `}</style>
      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
        }
      `}</style>
      <aside>
        <h1>Messenger App example</h1>
        <pre>{JSON.stringify({ accountId, conversationId }, null, 2)}</pre>
      </aside>

      <div>
        {conversationId && accountId ? (
          <ConversationMesssages
            conversationId={conversationId}
            accountId={accountId}
          />
        ) : null}
      </div>
    </div>
  );
}

interface MessagesResponse {
  rows: Message[];
  sort: "NEWEST_FIRST" | "OLDEST_FIRST";
  cursor_next: string;
  cursor_prev: string;
}

function ConversationMesssages({ conversationId, accountId }) {
  const apiPath = `/api/account/${accountId}/conversation/${conversationId}/messages`;
  const [messages, setMessages] = useState<Message[]>([]);

  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [newerCursor, setNewerCursor] = useState<string | null>(null);

  const { loadMoreRef, containerRef } = useInfiniteScroll(loadOlder);

  async function loadOlder() {
    if (!olderCursor) return;
    const resp = await fetch(`${apiPath}?cursor=${olderCursor}`);

    const data = await resp.json();
    const { sort, rows, cursor_next, cursor_prev } = data as MessagesResponse;

    const updatedOlderCursor =
      sort === "OLDEST_FIRST" ? cursor_next : cursor_prev;
    setOlderCursor(updatedOlderCursor);

    const sortedByNewestFirst = sort === "NEWEST_FIRST" ? rows : rows.reverse();

    // messages are already sorted by newest first
    setMessages((existing) => [...existing, ...sortedByNewestFirst]);
  }

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function getInitialMessages() {
      const response = await fetch(apiPath, {
        signal,
      });

      const data = await response.json();
      const { rows, cursor_next, cursor_prev } = data as MessagesResponse;

      setMessages(rows);
      setOlderCursor(cursor_prev);
      setNewerCursor(cursor_next);
    }

    getInitialMessages();

    return () => {
      controller.abort();
    };
  }, [apiPath]);

  // interval pooling for newer messages
  useInterval(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function loadNewer() {
      if (!newerCursor) return;
      const resp = await fetch(`${apiPath}?cursor=${newerCursor}`, { signal });

      const data = await resp.json();
      const { sort, rows, cursor_next, cursor_prev } = data as MessagesResponse;

      const updatedNewerCursor =
        sort === "NEWEST_FIRST" ? cursor_next : cursor_prev;

      setNewerCursor(updatedNewerCursor);

      const sortedByNewestFirst =
        sort === "NEWEST_FIRST" ? rows : rows.reverse();

      setMessages((existing) => [...sortedByNewestFirst, ...existing]);
    }

    loadNewer();

    return () => {
      controller.abort();
    };
  }, 10000);

  return (
    <div className="container">
      <style jsx>{`
        .container {
          background: mediumseagreen;
          height: 100vh;
          overflow: hidden;

          display: flex;
          flex-direction: column;
        }

        .messages {
          flex: 1;
          overflow: auto;

          display: flex;
          flex-direction: column-reverse;
          align-items: flex-end;
          gap: 10px;
          padding: 10px;
        }

        .message {
          background: white;
          border-radius: 5px;
          width: fit-content;
          padding: 1rem;
        }

        .secondary {
          color: hsl(0 0% 50% / 57%);
          font-size: 0.75rem;
        }

        p {
          padding: 0;
          line-height: 1.2rem;
          margin: 0;
        }

        form {
          display: flex;
          flex-direction: row;
          height: 36px;
        }

        input {
          flex: 1;
        }
      `}</style>
      <div className="messages" ref={containerRef}>
        {messages.map((message) => (
          <div key={message.id} className="message">
            <p>
              (<code>#{message.id})</code> {message.text}
            </p>
            <p className="secondary">
              by: {message.sender.name} at{" "}
              {new Intl.DateTimeFormat(undefined, {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",

                year: "numeric",
                month: "numeric",
                day: "numeric",
              }).format(new Date(message.createdAt))}
            </p>
          </div>
        ))}
        <div ref={loadMoreRef}>Loading older messages…</div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input type="text" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

interface Message {
  id: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
}

function useInterval(cb: () => () => void, delay: number) {
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
