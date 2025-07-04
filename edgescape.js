export default {
  async fetch(request, env, ctx) {
    // Create an array to hold HTML list items for headers
    const headerItems = [];
    for (const [key, value] of request.headers.entries()) {
      headerItems.push(`<strong>${key}:</strong> ${value}<br />`);
    }

    const content = `${headerItems.join('')}`;

    return new Response(content, {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
      },
    });
  },
};
