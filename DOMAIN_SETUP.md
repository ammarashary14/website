# Connect ammarashary.cc

The site is static HTML/CSS/JavaScript. Its `index.html` is in the repository
root, and it needs no dependencies or build. All assets use relative paths,
so the same files work at a custom domain's root.

Domain connection is pending. The current Cloudflare DNS records could not be
verified from the development environment, and no Cloudflare account connection
is available there. No DNS records or domain bindings have been changed.

## Cloudflare Pages (supports a private GitHub repository)

1. In Cloudflare, open **Workers & Pages**, create a **Pages** application,
   and connect GitHub. Authorize `ammarashary14/website`.
2. Use these build settings:
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `exit 0`
   - Build output directory: `.` (the repository root)
   - No environment variables are needed.
3. Deploy and open the resulting `pages.dev` URL. Check the homepage,
   `editor.html`, photo viewer, and `handouts/Homework_Problem_Set.pdf`.
4. In that Pages project, open **Custom domains → Set up a domain**, enter
   `ammarashary.cc`, and follow the confirmation steps. The domain must be
   an active Cloudflare zone in the same account, using Cloudflare's nameservers.
   Cloudflare Pages creates its required DNS record during this flow.
5. Wait for the domain to become active, then check `https://ammarashary.cc/`
   and `https://ammarashary.cc/editor.html` with HTTPS.

Add the domain through the Pages project's Custom domains flow before making
its DNS record manually. Do not guess the `pages.dev` hostname. Review existing
root-domain records before replacing them, and preserve unrelated mail records.

The editor's GitHub upload flow continues to work: commits to `main` trigger
new Cloudflare Pages deployments. Browser drafts belong to their original
hostname; before changing domains, download any draft you want to keep.

## Alternative: keep GitHub Pages

GitHub Free requires this repository to be public. A private repository needs
a GitHub plan that supports private-repository Pages. Changing repository
visibility is an account decision and has not been performed here.

1. In the GitHub repository's **Settings → Pages**, enable `main` and `/ (root)`.
2. Set **Custom domain** to `ammarashary.cc` and save. For branch deployment,
   GitHub creates the root `CNAME` file containing exactly `ammarashary.cc`.
3. In Cloudflare DNS, configure these website records with **DNS only**
   (grey cloud) while GitHub validates the domain and issues its certificate:

   | Type | Name | Content |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | ammarashary14.github.io |

   The `www` record is optional. Check for existing conflicting website A,
   AAAA, or CNAME records before changing them. Preserve unrelated records.
4. Once GitHub's DNS check and certificate issuance succeed, turn on
   **Enforce HTTPS**. Certificate availability can take up to 24 hours.

## Official documentation

- [Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare static HTML deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)
- [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
