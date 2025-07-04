// Sstatic list of ISO 3166-1 alpha-2 codes because the Intl.supportedValuesOf('region') function is not available
const ISO_3166_1_ALPHA_2_CODES = ['AF', 'AX', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AQ', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB','BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BQ', 'BA', 'BW', 'BV', 'BR', 'IO', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM','CA', 'KY', 'CF', 'TD', 'CL', 'CN', 'CX', 'CC', 'CO', 'KM', 'CD', 'CG', 'CK', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ','DK', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FK', 'FO', 'FJ', 'FI', 'FR', 'GF', 'PF', 'TF','GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU', 'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HM', 'VA', 'HN','HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR','KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MQ','MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MS', 'MA', 'MZ', 'MM', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI','NE', 'NG', 'NU', 'NF', 'MK', 'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PN', 'PL', 'PT', 'PR','QA', 'RE', 'RO', 'RU', 'RW', 'BL', 'SH', 'KN', 'LC', 'MF', 'PM', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS', 'SC', 'SL','SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'GS', 'SS', 'ES', 'LK', 'SD', 'SR', 'SJ', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ','TH', 'TL', 'TG', 'TK', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC', 'TV', 'UG', 'UA', 'AE', 'GB', 'UM', 'US', 'UY', 'UZ', 'VU','VE', 'VN', 'VG', 'VI', 'WF', 'EH', 'YE', 'ZM', 'ZW'];

// Map lazy initialization to save ressources
let countryCodeMap = null;

function getCountryCode(countryName) {
  // If the map hasn't been created yet
  if (!countryCodeMap) {
    countryCodeMap = new Map();
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    // Use the hardcoded list to build the map
    for (const code of ISO_3166_1_ALPHA_2_CODES) {
      const name = regionNames.of(code);
      if (name) {
        // Store the lowercase name as the key for case-insensitive matching
        countryCodeMap.set(name.toLowerCase(), code);
      }
    }
  }
  // Convert the input to lowercase and look it up in the map
  return countryCodeMap.get(countryName.toLowerCase()) || 'n/a';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Get the suffix of the URL path
    const pathSuffix = url.pathname.split('/').filter(suffix => suffix);
    const countryName = decodeURIComponent(pathSuffix.pop() || '');

    // 404 HTML
    const notFoundHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>404 Not Found</title>
        <style> body { font-family: sans-serif; background-color: #fafafa; text-align: center; margin-top: 50px; } h1 { color: #333; } p { color: #666; } </style>
      </head>
      <body>
        <h1>🚫 404 - Not Found</h1>
        <p>The resource you requested could not be found.</p>
      </body>
      </html>
    `;
    const notFoundHeaders = { headers: { 'Content-Type': 'text/html;charset=UTF-8' }, status: 404 };

    if (!countryName) {
      return new Response(notFoundHtml, notFoundHeaders);
    }
    
    // Lookup function to get the country code
    const countryCode = getCountryCode(countryName);

    if (countryCode === 'n/a') {
      return new Response(notFoundHtml, notFoundHeaders);
    }

    try {
      // Use the derived country code to build the R2 object key
      const objectKey = `${countryCode.toLowerCase()}.svg`;
      
      // R2 binding name from wrangler.toml
      const object = await env.BUCKET_COUNTRY_FLAGS.get(objectKey);

      if (object === null) {
        console.log(`Object not found in R2: ${objectKey}`);
        return new Response(notFoundHtml, notFoundHeaders);
      }

      // Serve the image with the correct headers
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Content-Type', 'image/svg+xml');

      return new Response(object.body, { headers });
    } catch (e) {
      return new Response(`Error: ${e.message}`, { status: 500 });
    }
  },
};
