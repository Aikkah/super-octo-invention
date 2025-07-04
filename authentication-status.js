export default {
  async fetch(request) {
    let responseContent = 'Error: Could not find all required headers.'; // Default message

    // Get the required headers from the incoming request
    const jwt = request.headers.get('cf-access-jwt-assertion');
    const email = request.headers.get('cf-access-authenticated-user-email');
    const countryCode = request.headers.get('cf-ipcountry');

    if (jwt && email && countryCode) {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        const formattedDate = new Date(payload.iat * 1000).toUTCString();

        if (countryCode === 'T1') {
          responseContent = `${email} authenticated at ${formattedDate} from Tor Network`;
        }
        else if (countryCode === 'XX') {
          responseContent = `${email} authenticated at ${formattedDate} from Unknown location`;
        }
        else {
          const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
          const countryName = regionNames.of(countryCode);
          responseContent = `${email} authenticated at ${formattedDate} from <a href="/secure/${countryName}">${countryName}</a>`;
        }
      } catch (e) {
        // Set the error message
        responseContent = `Failed to parse data: ${e.message}`;
      }
    }

    // --- HTML Template ---
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
            <title>Authentication Status</title>
            <style> body { font-family: sans-serif; background-color: #fafafa; text-align: center; margin-top: 50px; } h1 { color: #333; } p { color: #666; } </style>
        </head>
        <body>
            <h1>Authentication Status</h1>
            <p>${responseContent}</p>
        </body>
      </html>
    `;

    // --- Return Response ---
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
      },
    });
  },
};
