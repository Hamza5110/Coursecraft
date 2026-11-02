import { Link } from "react-router-dom";
import { mediaUrl } from "../api/blogApi";

export default function Card({
  id,
  title,
  body,
  authorName,
  likesCount = 0,
  coverImage,
}) {
  const preview =
    body?.length > 120 ? `${body.slice(0, 120)}...` : body;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 border border-gray-200 flex flex-col overflow-hidden">
      {coverImage && (
        <img
          src={mediaUrl(coverImage)}
          alt={title}
          className="w-full h-40 object-cover bg-gray-200"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <div className="p-6 flex flex-col flex-1">
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
    </div>
  );
}
