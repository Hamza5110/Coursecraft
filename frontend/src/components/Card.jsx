import { memo } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../api/blogApi";
import { stripHtml } from "../utils/html";

function Card({
  id,
  title,
  body,
  excerpt,
  authorName,
  likesCount = 0,
  coverImage,
}) {
  const plain = excerpt || stripHtml(body || "");
  const preview =
    plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
  const src = mediaUrl(coverImage);

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:shadow-md">
      {src ? (
        <img
          src={src}
          alt=""
          width={400}
          height={160}
          loading="lazy"
          decoding="async"
          className="h-40 w-full bg-gray-200 object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 line-clamp-2 text-xl font-semibold text-gray-800">
          <Link
            to={`/blogs/${id}`}
            className="after:absolute after:inset-0 hover:text-blue-700"
          >
            {title}
          </Link>
        </h3>
        {authorName && (
          <p className="mb-3 text-sm text-gray-500">By {authorName}</p>
        )}
        <p className="mb-4 flex-1 text-gray-600">{preview}</p>
        <p className="text-sm text-gray-500">
          {likesCount} like{likesCount === 1 ? "" : "s"}
        </p>
      </div>
    </article>
  );
}

export default memo(Card);
