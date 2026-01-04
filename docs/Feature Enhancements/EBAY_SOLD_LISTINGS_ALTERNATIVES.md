# Free Alternatives for eBay Sold Listings Data

## Current Situation
- eBay Finding API (`findCompletedItems`) is **deprecated** (decommissioned Feb 2025)
- eBay Browse API does **NOT** support sold/completed listings
- Current implementation falls back to URL generation for manual searching

## Free Options Analysis

### 1. eBay Marketplace Insights API ⭐ **RECOMMENDED**

**Overview**: Official eBay API providing sales history data for items sold up to 90 days in the past.

**Pros**:
- ✅ Official eBay API (no legal concerns)
- ✅ Free if approved
- ✅ Provides actual sold price data
- ✅ 90-day historical data
- ✅ More reliable than scraping

**Cons**:
- ⚠️ Limited release - requires approval from eBay business units
- ⚠️ Not all eBay categories supported
- ⚠️ Approval process may take time
- ⚠️ Access not guaranteed

**How to Apply**:
1. Visit: https://www.edp.ebay.com/api-docs/buy/marketplace-insights/static/overview.html
2. Contact eBay Developer Program Support
3. Explain your use case (disc golf marketplace price research)
4. Request access to Marketplace Insights API

**Implementation Requirements**:
- OAuth 2.0 Application Access Token
- API supports item group searches by product ID or GTIN
- May need to map search keywords to product identifiers

**API Endpoints**:
- `GET /buy/marketplace_insights/v1_beta/item_sales/search`
- Search by product identifier (UPC, EAN, ISBN, or eBay Product ID)

---

### 2. Self-Hosted Web Scraping ⚠️ **RISKY**

**Overview**: Scrape eBay's sold listings directly from their website.

**Pros**:
- ✅ Completely free (server resources only)
- ✅ No approval needed
- ✅ Can be customized to your needs

**Cons**:
- ❌ **Likely violates eBay's Terms of Service**
- ❌ Legal risks (potential account bans, legal action)
- ❌ CAPTCHA challenges require manual intervention
- ❌ Frequent maintenance needed (eBay changes HTML structure)
- ❌ Rate limiting and IP blocking
- ❌ Unreliable for production use

**Legal Concerns**:
- eBay's User Agreement generally prohibits automated data collection
- Could result in:
  - IP address blocking
  - Account suspension
  - Legal action (unlikely but possible)

**If Proceeding (Not Recommended)**:
- Use headless browser (Puppeteer/Playwright)
- Implement rate limiting and delays
- Handle CAPTCHAs (may require manual solving)
- Rotate user agents and IPs
- Monitor for HTML structure changes

**Open Source Reference**:
- [eBayMarketAnalyzer](https://github.com/driscoll42/ebayMarketAnalyzer) - Python tool that requires manual XML data extraction due to CAPTCHAs

---

### 3. FreeWebAPI eBay Data Scraper ❓ **UNVERIFIED**

**Overview**: Third-party free API claiming to scrape eBay data.

**URL**: https://freewebapi.com/data-apis/ebay-data-scraper-api/

**Pros**:
- ✅ Claims to be free
- ✅ No approval needed

**Cons**:
- ❓ Unknown if supports sold/completed listings
- ❓ Reliability and uptime unknown
- ❓ May violate eBay's ToS (using their service)
- ❓ Data accuracy/currency concerns
- ❓ Rate limits and usage restrictions unknown
- ❓ Service may disappear or become paid

**Recommendation**: Investigate further, but approach with caution. Test if it actually supports sold listings.

---

## Recommended Approach

### Phase 1: Apply for eBay Marketplace Insights API (Immediate)
1. Contact eBay Developer Program Support
2. Submit application explaining use case
3. Wait for approval (may take weeks/months)

### Phase 2: Improve URL Fallback (Current)
- Keep existing URL generation as primary method
- Enhance UX to make manual search more helpful
- Consider adding instructions/tips for users

### Phase 3: Monitor FreeWebAPI (Optional)
- Test if FreeWebAPI supports sold listings
- Verify reliability and data quality
- Document findings

### Phase 4: Do NOT Implement Self-Hosted Scraping
- Legal/ToS risks outweigh benefits
- Maintenance burden too high
- Unreliable for production

---

## Implementation Plan for Marketplace Insights API

If/when approved for Marketplace Insights API:

### Required Changes:
1. Replace Finding API code with Marketplace Insights API
2. Update authentication to use OAuth 2.0 tokens
3. Modify search to work with product identifiers (may need keyword → product ID mapping)
4. Update response parsing for new API format
5. Update tests

### Environment Variables Needed:
```env
EBAY_CLIENT_ID=<from eBay Developer Console>
EBAY_CLIENT_SECRET=<from eBay Developer Console>
EBAY_SANDBOX=true  # Set to false for production
```

### API Flow:
1. Authenticate with OAuth 2.0 to get Application Access Token
2. Search for product by identifier (UPC/EAN/ISBN) or eBay Product ID
3. Get sales history for matching products
4. Format and return results

---

## Current Status: URL Fallback

The current implementation already provides a working solution:
- Generates properly formatted eBay search URLs
- Includes filters for sold/completed listings
- Users can manually view results on eBay
- No legal concerns
- No maintenance burden

**Recommendation**: Keep current URL fallback as primary method until Marketplace Insights API access is obtained.

---

## Next Steps

1. ✅ Document alternatives (this document)
2. 🔄 Apply for eBay Marketplace Insights API access
3. 🔄 Test FreeWebAPI (if time permits)
4. ⏸️ Wait for API approval
5. ⏸️ Implement Marketplace Insights API when approved

---

## References

- [eBay Marketplace Insights API Docs](https://www.edp.ebay.com/api-docs/buy/marketplace-insights/static/overview.html)
- [eBay API Deprecation Status](https://developer.ebay.com/develop/get-started/api-deprecation-status)
- [eBay Browse API (doesn't support sold listings)](https://developer.ebay.com/api-docs/buy/browse/resources/methods)
- [eBayMarketAnalyzer GitHub](https://github.com/driscoll42/ebayMarketAnalyzer)

