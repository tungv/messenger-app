import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <h1>Messenger App example</h1>
      <p>
        <Link href="/account/1/conversation/1">
          <a>
            Jump to <code>/account/1/conversation/1</code>
          </a>
        </Link>
      </p>
    </div>
  );
}
