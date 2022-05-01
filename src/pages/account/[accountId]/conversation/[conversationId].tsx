import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
        <ConversationMesssages
          conversationId={conversationId}
          accountId={accountId}
        />
      </div>
    </div>
  );
}

function ConversationMesssages({ conversationId, accountId }) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function getMessages() {
      const response = await fetch(
        `/api/account/${conversationId}/conversation/${conversationId}/messages`,
        {
          signal,
        },
      );

      const data = await response.json();
      const { sort, rows, cursor_next, cursor_prev } = data;

      setMessages(rows);
    }

    getMessages();

    return () => {
      controller.abort();
    };
  }, [conversationId, accountId]);

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
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <p>{message.text}</p>
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
