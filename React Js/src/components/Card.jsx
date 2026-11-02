import { Link } from "react-router-dom";

export default function Card({ id, title, body, authorName, likesCount = 0 }) {
  const preview =
    body?.length > 120 ? `${body.slice(0, 120)}...` : body;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 p-6 border border-gray-200 flex flex-col">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      {authorName && (
        <p className="text-sm text-gray-500 mb-3">By {authorName}</p>
      )}
      <p className="text-gray-600 mb-4 flex-1">{preview}</p>
      <p className="text-sm text-gray-500 mb-4">
        {likesCount} like{likesCount === 1 ? "" : "s"}
      </p>
      <Link
        to={`/blogs/${id}`}
        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition text-center"
      >
        Read More &rarr;
      </Link>
    </div>
  );
}
