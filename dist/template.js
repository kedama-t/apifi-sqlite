"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.template = void 0;
exports.template = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title></title>
    <style>
        table,th,td{
            border: 1px solid rgb(159, 185, 218);
        }
    </style>
  </head>
  <body>
    <h1>APIs for <%- dbPath %></h1>
    <table>
      <tr>
        <th scope="col">Method</th>
        <th scope="col">Route</th>
      </tr>
      <% for (let route of routes) { %>
        <tr>
            <td><%- route.method %></td>
            <td>
                <a href="<%- route.path %>" target="_blank">
                    <%- route.path %>
                </a>
            </td>
        </tr>
      <% } %>
    </table>
  </body>
</html>`;
