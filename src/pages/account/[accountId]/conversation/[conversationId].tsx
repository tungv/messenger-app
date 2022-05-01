import { useRouter } from "next/router";
import ConversationMesssages from "../../../../components/ConversationMessages";

export default function ConversationPage() {
  const router = useRouter();
  const {
    query: { accountId, conversationId },
  } = router;

  const ready = accountId && conversationId;

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
        {ready && (
          <ConversationMesssages
            conversationId={conversationId}
            accountId={accountId}
          />
        )}
      </div>
    </div>
  );
}
