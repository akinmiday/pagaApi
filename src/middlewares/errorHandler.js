const { logEvents } = require("./logEvents");

const errorHandler = (err, req, res, next) => {
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}`,
    "errLog.txt"
  );
  console.error(err.stack);
  res.status(500).json({ message: err.message });
};

module.exports = errorHandler;
