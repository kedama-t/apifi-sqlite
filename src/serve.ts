import createApp from "./createApp";
import type { APIRoute } from "./createApp";

const dbPath = process.argv[2]; // コマンドライン引数からDBのパスを取得
const port = process.argv[3] || 3000; // コマンドライン引数からportを取得
if (!dbPath) {
  console.error("Please specify the path to the sqlite db file.");
} else {
  createApp(dbPath).then(({ app, routes }) => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      routes.forEach((route: APIRoute) => {
        console.log(
          `- ${route.method} : http://localhost:${port}${route.path}`
        );
      });
    });
  });
}
