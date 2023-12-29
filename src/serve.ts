import createApp from './createApp';
import type { APIRoute } from './createApp';

export const serve = (dbPath?: string, port = 3000) => {
  if (!dbPath) {
    console.error('Please specify the path to the sqlite db file.');
  } else {
    (async () => {
      const { app, routes } = await createApp(dbPath);
      app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
        routes.forEach((route: APIRoute) => {
          console.log(
            `- ${route.method} : http://localhost:${port}${route.path}`
          );
        });
      });
    })();
  }
};
