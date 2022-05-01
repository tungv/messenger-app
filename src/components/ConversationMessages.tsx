import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useInfiniteScroll from "./useInfiniteScroll";
import useInterval from "./useInterval";

interface Message {
  id: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
}
interface MessagesResponse {
  rows: Message[];
  sort: "NEWEST_FIRST" | "OLDEST_FIRST";
  cursor_next: string;
  cursor_prev: string;
}

interface LocalMessage extends Message {
  isUploaded: boolean;
}

export default function ConversationMesssages({ conversationId, accountId }) {
  const apiPath = `/api/account/${accountId}/conversation/${conversationId}/messages`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);

  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [newerCursor, setNewerCursor] = useState<string | null>(null);

  // infinite scroll
  const { loadMoreRef, containerRef } = useInfiniteScroll(
    async function loadOlder() {
      if (!olderCursor) return;
      const resp = await fetch(`${apiPath}?cursor=${olderCursor}`);

      const data = await resp.json();
      const { sort, rows, cursor_next, cursor_prev } = data as MessagesResponse;

      const updatedOlderCursor =
        sort === "OLDEST_FIRST" ? cursor_next : cursor_prev;
      setOlderCursor(updatedOlderCursor);

      const sortedByNewestFirst =
        sort === "NEWEST_FIRST" ? rows : rows.reverse();

      // messages are already sorted by newest first
      setMessages((existing) => [...existing, ...sortedByNewestFirst]);
    },
  );

  // initial load
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
      setLocalMessages([]);
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
        {localMessages.map((message) => (
          <LocalChatMessage key={message.id} message={message} />
        ))}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={loadMoreRef}>Loading older messages…</div>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          const form = e.target;
          const input = form["text"] as HTMLInputElement;

          // get message text from form element without controlled input
          const text = input.value;
          input.value = "";

          const localId = `local-${Date.now()}`;
          const localMessage: LocalMessage = {
            id: localId,
            text: text,
            isUploaded: false,
            sender: {
              id: accountId,
              name: "~",
            },
            createdAt: new Date().toISOString(),
          };

          setLocalMessages((existing) => [localMessage, ...existing]);

          const newMessageObject: Message = await createNewMessage(
            apiPath,
            text,
          );

          setLocalMessages((existing) => {
            // find the existing message with the same id
            const existingMessage = existing.find((m) => m.id === localId);
            if (existingMessage) {
              // replace it with the new message
              const index = existing.indexOf(existingMessage);
              return [
                ...existing.slice(0, index),
                { ...newMessageObject, isUploaded: true },
                ...existing.slice(index + 1),
              ];
            } else {
              // add the new message to the beginning
              return [{ ...newMessageObject, isUploaded: true }, ...existing];
            }
          });
        }}
      >
        <input
          id="text"
          aria-label="New Chat Message"
          placeholder="new message"
          type="text"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const router = useRouter();
  const {
    query: { accountId },
  } = router;
  return (
    <div
      key={message.id}
      className="message"
      style={{
        alignSelf: accountId === message.sender.id ? "flex-end" : "flex-start",
      }}
    >
      <p>
        (<code>#{message.id})</code> {message.text}
      </p>
      <p className="secondary">
        by: {accountId === message.sender.id ? "You" : message.sender.name} at{" "}
        {new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }).format(new Date(message.createdAt))}
      </p>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}
function LocalChatMessage({ message }: { message: LocalMessage }) {
  return (
    <div
      key={message.id}
      className="message"
      style={{ opacity: message.isUploaded ? 1 : 0.7 }}
    >
      <p>
        (<code>#{message.id})</code> {message.text}
      </p>
      <p className="secondary">
        by: You at{" "}
        {new Intl.DateTimeFormat(undefined, {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }).format(new Date(message.createdAt))}
      </p>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}

async function createNewMessage(url: string, text: string): Promise<Message> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<Message>;
}
