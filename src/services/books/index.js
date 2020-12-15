const express = require("express");
const uniqid = require("uniqid");
const { getBooks, writeBooks } = require("../../fsUtilities");

const booksRouter = express.Router();

booksRouter.get("/", async (req, res, next) => {
  try {
    const books = await getBooks();

    if (req.query && req.query.category) {
      const filteredBooks = books.filter(
        book =>
          book.hasOwnProperty("category") &&
          book.category === req.query.category
      );
      res.send(filteredBooks);
    } else {
      res.send(books);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.get("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks();

    const bookFound = books.find(book => book.asin === req.params.asin);

    if (bookFound) {
      res.send(bookFound);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.post("/", async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error();
      error.message = errors;
      error.httpStatusCode = 400;
      next(error);
    } else {
      const books = await getBooks();

      const asinFound = books.find(book => book.asin === req.body.asin);

      if (asinFound) {
        const error = new Error();
        error.httpStatusCode = 400;
        error.message = "Book already in db";
        next(error);
      } else {
        books.push(req.body);
        await writeBooks(books);
        res.status(201).send({ asin: req.body.asin });
      }
    }
  } catch (error) {
    console.log(error);
    const err = new Error("An error occurred while reading from the file");
    next(err);
  }
});

booksRouter.put("/:asin", async (req, res, next) => {
  try {
    const validatedData = matchedData(req);
    const books = await getBooks();

    const bookIndex = books.findIndex(book => book.asin === req.params.asin);

    if (bookIndex !== -1) {
      // book found
      const updatedBooks = [
        ...books.slice(0, bookIndex),
        { ...books[bookIndex], ...validatedData },
        ...books.slice(bookIndex + 1),
      ];
      await writeBooks(updatedBooks);
      res.send(updatedBooks);
    } else {
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    const err = new Error("An error occurred while reading from the file");
    next(err);
  }
});

booksRouter.delete("/:asin", async (req, res, next) => {
  try {
    const books = await getBooks();

    const bookFound = books.find(book => book.asin === req.params.asin);

    if (bookFound) {
      const filteredBooks = books.filter(book => book.asin !== req.params.asin);

      await writeBooks(filteredBooks);
      res.status(204).send();
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.post("/:asin/comments", async (req, res, next) => {
  try {
    const books = await getBooks(); // fetches book array

    const bookIndex = books.findIndex(book => book.asin === req.params.asin); // get the book we're commenting

    if (bookIndex !== -1) {
      //book found

      if (books[bookIndex].hasOwnProperty("comments")) {
        //has comments already
        books[bookIndex].comments.push({
          ...req.body,
          CommentID: uniqid(),
          createdAT: new Date(),
        });
      } else {
        //has no comments
        books[bookIndex].comments = [];
        books[bookIndex].comments.push({
          ...req.body,
          CommentID: uniqid(),
          createdAT: new Date(),
        });
      }
      await writeBooks(books);
      res.send(books);
    } else {
      //book not found
      const err = new Error();
      err.httpStatusCode = 404;
      next(err);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.get("/:asin/comments", async (req, res, next) => {
  try {
    const books = await getBooks(); // fetches book array
    const bookFound = books.find(book => book.asin === req.params.asin);

    if (bookFound) {
      if (bookFound.hasOwnProperty("comments")) {
        res.status(200).send(bookFound.comments);
      } else {
        res.status(404).send("this book has no comments.");
      }
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

booksRouter.delete("/:asin/comments/:commentID", async (req, res, next) => {
  try {
    const books = await getBooks(); //fetches book array
    const bookIndex = books.findIndex(book => book.asin === req.params.asin);

    if (bookIndex !== -1) {
      let updateComents = books[bookIndex].comments.filter(
        comment => comment.CommentID !== req.params.commentID
      );
      books[bookIndex].comments = updateComents;

      await writeBooks(books);

      res.send(books);
      // if(updatedComments.length > 1) {
      //   books[bookIndex].comments
      // }
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});
module.exports = booksRouter;
