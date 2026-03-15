import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container not-found">
      <h1>404</h1>
      <p>This page could not be found.</p>
      <div className="not-found-links">
        <Link href="/" className="btn">Home</Link>
      </div>
    </div>
  );
}
