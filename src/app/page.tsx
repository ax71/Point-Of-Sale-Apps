import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-muted flex justify-center items-center h-screen flex-col space-y-4">
      <h1 className="text-4xl font-semibold">Welcome King BOB!!!</h1>
      <Link href="/admin">
        <button className="bg-amber-500 text-white px-4 py-2 rounded-md">
          Access Dashboard
        </button>
      </Link>
    </div>
  );
}
