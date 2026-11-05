import express, { type Express, type Request, type Response } from "express";
import path from "node:path";
import { existsSync, statSync } from "node:fs";

function cacheHeaders(res: Response, filename: string) {
  const hashed = /[-.][a-f0-9]{32}(?:\.[a-z0-9]+)+(?:\.br|\.gz)?$/i.test(filename);
  res.setHeader("Cache-Control", hashed ? "public, max-age=31536000, immutable" : "no-cache");
  res.vary("Accept-Encoding");
}

export function registerWebStatic(app: Express, webDist: string) {
  const root = path.resolve(webDist);
  app.use((req: Request, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    let pathname: string;
    try { pathname = decodeURIComponent(req.path); } catch { return next(); }
    if (pathname.startsWith("/api/") || /\.(br|gz)$/.test(pathname)) return next();
    let file = path.resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + path.sep)) return next();
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
    else if (!path.extname(file) && existsSync(`${file}.html`)) file += ".html";
    if (!/\.(js|css|json|html)$/.test(file) || !existsSync(file)) return next();
    const encoding = req.acceptsEncodings("br", "gzip", "identity");
    const suffix = encoding === "br" ? ".br" : encoding === "gzip" ? ".gz" : "";
    if (!suffix || !existsSync(file + suffix)) return next();
    res.type(path.extname(file));
    cacheHeaders(res, file);
    res.setHeader("Content-Encoding", suffix === ".br" ? "br" : "gzip");
    res.sendFile(file + suffix);
  });
  app.use(express.static(webDist, {
    index: "index.html", extensions: ["html"],
    setHeaders: (res, filename) => cacheHeaders(res, filename),
  }));
}
