import { useRouter } from "next/router";
import { useState } from "react";

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
        <ConversationMesssages />
      </div>
    </div>
  );
}

function ConversationMesssages() {
  const [messages, setMessages] = useState<Message[]>([]);

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
      <div className="messages"></div>
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
