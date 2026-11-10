import { Link } from "react-router-dom";
import Button from "./ui/Button";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-3 text-gray-600">
        That URL doesn&apos;t match anything on Coursecraft.
      </p>
      <Button as={Link} to="/" className="mt-6">
        Back to home
      </Button>
    </section>
  );
}
