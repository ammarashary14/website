# Connect ammarashary.cc through Cloudflare to GitHub Pages

The public repository uses GitHub Pages. Its root `CNAME` now declares
`ammarashary.cc`. GitHub processes that file during branch-based publication.
Cloudflare DNS and HTTPS verification are still pending; current DNS records
could not be inspected from this development environment.

## GitHub Pages

In **Settings → Pages**, use **Deploy from a branch**, `main`, and `/ (root)`.
After the commit with `CNAME` deploys, check that **Custom domain** displays
`ammarashary.cc`. If needed, enter it there and save. Do not remove `CNAME`
when uploading an edited `index.html`.

## Cloudflare DNS

For the `ammarashary.cc` zone, these are GitHub Pages' apex website records:

| Type | Name | Content | Proxy status |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | DNS only |
| A | @ | 185.199.109.153 | DNS only |
| A | @ | 185.199.110.153 | DNS only |
| A | @ | 185.199.111.153 | DNS only |
| CNAME | www | ammarashary14.github.io | DNS only |

The `www` record is optional. Inspect existing website A, AAAA, and CNAME
records before changing conflicting values. Preserve unrelated MX, TXT,
and other records. The target hostname has no `/website/` path.

Once DNS resolves correctly and GitHub issues the certificate, enable
**Enforce HTTPS** in GitHub Pages. Certificate availability can take up to
24 hours. Check both `https://ammarashary.cc/` and the editor at
`https://ammarashary.cc/editor.html`.

## Access needed to finish automatically

This chat can push to GitHub, but currently has no browser-control tool.
Requests to Cloudflare's dashboard and API are denied by the environment's
network policy. A draft configuration now requests the Cloudflare and domain
hosts, and a personal secret named `CLOUDFLARE_API_TOKEN`.

To use the API route, create a Cloudflare token with **Zone:DNS:Edit** and
**Zone:Zone:Read**, scoped only to the `ammarashary.cc` zone. Enter its value
securely in the environment's secret settings, never in chat or this repository.
Review/save the environment configuration and publish the environment. After
access is applied, first read the existing DNS records before making changes.

## Editing after the move

All site assets use relative paths, so the homepage, handout, photos, and editor
work at the custom domain's root. Continue uploading the dashboard's exported
`index.html` to `main`. Download any unsaved draft before switching domains:
browser drafts are stored separately for each hostname.

## Official documentation

- [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub manual CNAME configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages#cname-errors)
