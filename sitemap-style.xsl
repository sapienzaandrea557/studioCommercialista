<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<title>Sitemap XML - Studio Andrea Sapienza</title>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
				<style type="text/css">
					body {
						font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
						color: #0a1128;
						background-color: #fdfdfd;
						margin: 0;
						padding: 40px;
					}
					h1 {
						color: #b8953d;
						font-size: 24px;
						margin-bottom: 20px;
					}
					table {
						border-collapse: collapse;
						width: 100%;
						background: #fff;
						border-radius: 12px;
						overflow: hidden;
						box-shadow: 0 4px 20px rgba(0,0,0,0.05);
					}
					th {
						background-color: #0a1128;
						color: #fff;
						text-align: left;
						padding: 15px;
						font-size: 14px;
					}
					td {
						padding: 15px;
						border-bottom: 1px solid #eee;
						font-size: 14px;
					}
					tr:hover td {
						background-color: #f9f9f9;
					}
					a {
						color: #b8953d;
						text-decoration: none;
						font-weight: bold;
					}
					.footer {
						margin-top: 20px;
						font-size: 12px;
						color: #666;
					}
				</style>
			</head>
			<body>
				<h1>Mappa del Sito (Sitemap XML)</h1>
				<p>Questo file aiuta i motori di ricerca come Google a indicizzare correttamente le pagine dello Studio Andrea Sapienza.</p>
				<table>
					<tr>
						<th>URL</th>
						<th>Frequenza</th>
						<th>Priorità</th>
						<th>Ultima Modifica</th>
					</tr>
					<xsl:for-each select="sitemap:urlset/sitemap:url">
						<tr>
							<td>
								<a href="{sitemap:loc}">
									<xsl:value-of select="sitemap:loc"/>
								</a>
							</td>
							<td>
								<xsl:value-of select="sitemap:changefreq"/>
							</td>
							<td>
								<xsl:value-of select="sitemap:priority"/>
							</td>
							<td>
								<xsl:value-of select="sitemap:lastmod"/>
							</td>
						</tr>
					</xsl:for-each>
				</table>
				<div class="footer">
					© 2026 Studio Andrea Sapienza - Commercialista Roma Trastevere
				</div>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
