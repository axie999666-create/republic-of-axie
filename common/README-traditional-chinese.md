# Sitewide Chinese script switch

`traditional-chinese.js` adds a floating Simplified/Traditional Chinese switch to the site's HTML pages. It uses the self-hosted `opencc-js` 1.4.2 UMD build, converts displayed text nodes without changing source HTML or stored data, watches dynamically rendered content, and persists the selected script in local storage. The passport dialog in `admin/citizens.html` is deliberately excluded because its pages are kept in Traditional Chinese.

The vendored library and associated notices are in `opencc-js-1.4.2-cn2t.js` and `licenses/`.
