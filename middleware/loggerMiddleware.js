const loggerMiddleware = (req, res, next) => {
    console.log("----- Incoming Request -----");
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.originalUrl}`);
    console.log("Headers:", req.headers);
    if (req.method === "POST" || req.method === "PUT") {
      console.log("Body:", req.body);
    }
  
    // Capture the response
    const originalSend = res.send;
    res.send = function (body) {
      console.log("----- Response -----");
      console.log(`Status: ${res.statusCode}`);
      console.log("Body:", body);
      console.log("--------------------");
      originalSend.call(this, body);
    };
  
    // Capture errors
    res.on("finish", () => {
      if (res.statusCode >= 400) {
        console.error("----- Error Response -----");
        console.error(`Status: ${res.statusCode}`);
        console.error("Headers:", res.getHeaders());
        console.error("--------------------------");
      }
    });
  
    next(); // Pass control to the next middleware
  };
  
  export default loggerMiddleware;