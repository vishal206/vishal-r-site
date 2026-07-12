import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Book3D from "../../components/Book3D";
import { getBooksSync } from "../../Utils/markdownLoader";

const BooksSection: React.FC = () => {
  const books = useMemo(() => getBooksSync(), []);

  return (
    <div className="flex-1 px-6 md:px-12 pb-10 max-w-screen-xl mx-auto w-full">
      {books.length === 0 ? (
        <div className="text-center text-editorial-label text-sm py-16">
          No books yet.
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-x-14 gap-y-12 md:gap-x-20 md:gap-y-16 pt-12 md:pt-16 items-end">
          {books.map((book) => (
            <Link key={book.slug} to={`/book/${book.slug}`} className="group">
              <Book3D book={book} height={{ base: 200, md: 260 }} tiltDeg={22} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BooksSection;
